-- Host listings, approval publishing, host reservations, and paid-booking notices.

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS host_id TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tourism_license_number TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
DECLARE
  host_id_type TEXT;
  image_type TEXT;
BEGIN
  SELECT data_type INTO host_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'host_id';
  IF host_id_type <> 'text' THEN
    ALTER TABLE public.properties ALTER COLUMN host_id TYPE TEXT USING host_id::text;
  END IF;

  SELECT data_type INTO image_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'images';
  IF image_type = 'ARRAY' THEN
    ALTER TABLE public.properties ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.properties ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

UPDATE public.properties
SET status = CASE
  WHEN status = 'rejected' THEN 'rejected'
  WHEN is_approved IS TRUE THEN 'approved'
  ELSE 'pending'
END
WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected');

ALTER TABLE public.properties ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.properties ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.properties ALTER COLUMN is_approved SET DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug) WHERE slug IS NOT NULL;

DROP POLICY IF EXISTS "Hosts can view their own properties" ON public.properties;
CREATE POLICY "Hosts can view their own properties"
ON public.properties FOR SELECT TO authenticated
USING (host_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Hosts can submit their own properties" ON public.properties;
CREATE POLICY "Hosts can submit their own properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (
  host_id = (auth.jwt() ->> 'sub')
  AND is_approved = false
  AND status = 'pending'
);

DROP POLICY IF EXISTS "Hosts can update their own unpublished properties" ON public.properties;
CREATE POLICY "Hosts can update their own unpublished properties"
ON public.properties FOR UPDATE TO authenticated
USING (host_id = (auth.jwt() ->> 'sub') AND is_approved = false)
WITH CHECK (
  host_id = (auth.jwt() ->> 'sub')
  AND is_approved = false
  AND status IN ('pending', 'rejected')
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id) WHERE payment_id IS NOT NULL;

DROP POLICY IF EXISTS "Hosts can view bookings for their properties" ON public.bookings;
CREATE POLICY "Hosts can view bookings for their properties"
ON public.bookings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = bookings.property_id
      AND p.host_id = (auth.jwt() ->> 'sub')
  )
);

CREATE TABLE IF NOT EXISTS public.host_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (host_id, booking_id, event_type)
);

ALTER TABLE public.host_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hosts can read their notifications" ON public.host_notifications;
CREATE POLICY "Hosts can read their notifications"
ON public.host_notifications FOR SELECT TO authenticated
USING (host_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Hosts can mark their notifications read" ON public.host_notifications;
CREATE POLICY "Hosts can mark their notifications read"
ON public.host_notifications FOR UPDATE TO authenticated
USING (host_id = (auth.jwt() ->> 'sub'))
WITH CHECK (host_id = (auth.jwt() ->> 'sub'));
REVOKE UPDATE ON public.host_notifications FROM anon, authenticated;
GRANT UPDATE (is_read) ON public.host_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_host_after_paid_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id TEXT;
  v_property_title TEXT;
BEGIN
  IF NEW.status = 'confirmed'::booking_status
     AND NEW.payment_status = 'success'::payment_status
     AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    SELECT host_id, title INTO v_host_id, v_property_title
    FROM public.properties
    WHERE id = NEW.property_id;

    IF v_host_id IS NOT NULL AND v_host_id <> '' THEN
      INSERT INTO public.host_notifications (
        host_id, property_id, booking_id, event_type, title, body
      ) VALUES (
        v_host_id,
        NEW.property_id,
        NEW.id,
        'booking_paid',
        'New confirmed booking',
        format('%s was booked (%s).', coalesce(v_property_title, 'Your property'), coalesce(NEW.booking_reference, NEW.id::text))
      )
      ON CONFLICT (host_id, booking_id, event_type) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_paid_host_notification ON public.bookings;
CREATE TRIGGER booking_paid_host_notification
AFTER UPDATE OF status, payment_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_host_after_paid_booking();

-- The payment callback is the only caller allowed to confirm payment.
CREATE OR REPLACE FUNCTION public.confirm_verified_booking(
  p_booking_ref TEXT,
  p_payment_id TEXT,
  p_gateway TEXT,
  p_amount NUMERIC,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE booking_reference = p_booking_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  IF v_booking.payment_id = p_payment_id
     AND v_booking.status = 'confirmed'::booking_status
     AND v_booking.payment_status = 'success'::payment_status THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'booking_reference', p_booking_ref);
  END IF;

  IF v_booking.payment_id IS NOT NULL AND v_booking.payment_id <> p_payment_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_already_paid');
  END IF;

  IF ABS(v_booking.total_price - p_amount) > 0.01 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_mismatch');
  END IF;

  UPDATE public.bookings
  SET status = 'confirmed'::booking_status,
      payment_status = 'success'::payment_status,
      payment_method = p_gateway,
      payment_id = p_payment_id,
      smart_lock_pin = p_pin,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_booking.id;

  INSERT INTO public.property_availability (property_id, date, is_available)
  SELECT v_booking.property_id, d::date, false
  FROM generate_series(v_booking.check_in, v_booking.check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
  ON CONFLICT (property_id, date) DO UPDATE
    SET is_available = false, updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object('success', true, 'booking_reference', p_booking_ref);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_verified_booking(TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_verified_booking(TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Hosts can upload their property images" ON storage.objects;
CREATE POLICY "Hosts can upload their property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Hosts can update their property images" ON storage.objects;
CREATE POLICY "Hosts can update their property images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'))
WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Hosts can delete their property images" ON storage.objects;
CREATE POLICY "Hosts can delete their property images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'host_notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.host_notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'properties'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;
END $$;
