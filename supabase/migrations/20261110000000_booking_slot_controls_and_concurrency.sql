-- Booking Slot Formats (4 PM - 12 PM Default & Optional 12 AM - 12 PM 12h),
-- Manual Slot Config Storage, and Concurrency / Overlap Protection.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS booking_slot_config JSONB DEFAULT '{}'::jsonb;

-- PostgreSQL atomic exclusion check preventing concurrent or overlapping bookings
CREATE OR REPLACE FUNCTION public.prevent_overlapping_active_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_active BOOLEAN;
  v_new_start TIMESTAMP;
  v_new_end TIMESTAMP;
  v_conflict_ref TEXT;
BEGIN
  IF NEW.status IN ('cancelled', 'rejected', 'refunded') THEN
    RETURN NEW;
  END IF;

  v_new_active := (
    NEW.status IN ('confirmed', 'completed')
    OR (
      NEW.status = 'pending'
      AND COALESCE(NEW.created_at, timezone('utc'::text, now())) > (timezone('utc'::text, now()) - INTERVAL '15 minutes')
    )
  );

  IF NOT v_new_active THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent inserts/updates for the exact same property inside Postgres
  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));

  v_new_start := NEW.check_in::timestamp + COALESCE(NEW.checkin_time, '16:00'::time);
  v_new_end := NEW.check_out::timestamp + COALESCE(NEW.checkout_time, '12:00'::time);

  IF v_new_end <= v_new_start THEN
    RAISE EXCEPTION 'invalid_booking_time_window: checkout timestamp must be after checkin timestamp';
  END IF;

  SELECT b.booking_reference INTO v_conflict_ref
  FROM public.bookings b
  WHERE b.property_id = NEW.property_id
    AND (NEW.id IS NULL OR b.id <> NEW.id)
    AND (
      b.status IN ('confirmed', 'completed')
      OR (
        b.status = 'pending'
        AND b.created_at > (timezone('utc'::text, now()) - INTERVAL '15 minutes')
      )
    )
    AND (b.check_in::timestamp + COALESCE(b.checkin_time, '16:00'::time)) < v_new_end
    AND (b.check_out::timestamp + COALESCE(b.checkout_time, '12:00'::time)) > v_new_start
  LIMIT 1;

  IF v_conflict_ref IS NOT NULL THEN
    RAISE EXCEPTION 'booking_slot_overlap: conflicts with active booking %', v_conflict_ref;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_no_overlapping_bookings ON public.bookings;
CREATE TRIGGER enforce_no_overlapping_bookings
BEFORE INSERT OR UPDATE OF property_id, check_in, check_out, checkin_time, checkout_time, status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_active_bookings();

-- Update confirm_verified_booking so same-day 12-hour bookings (check_in = check_out)
-- do not block the entire day and verified slot overlap checks run atomically.
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
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_conflict_ref TEXT;
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

  PERFORM pg_advisory_xact_lock(hashtext(v_booking.property_id::text));

  v_start := v_booking.check_in::timestamp + COALESCE(v_booking.checkin_time, '16:00'::time);
  v_end := v_booking.check_out::timestamp + COALESCE(v_booking.checkout_time, '12:00'::time);

  SELECT b.booking_reference INTO v_conflict_ref
  FROM public.bookings b
  WHERE b.property_id = v_booking.property_id
    AND b.id <> v_booking.id
    AND b.status IN ('confirmed', 'completed')
    AND (b.check_in::timestamp + COALESCE(b.checkin_time, '16:00'::time)) < v_end
    AND (b.check_out::timestamp + COALESCE(b.checkout_time, '12:00'::time)) > v_start
  LIMIT 1;

  IF v_conflict_ref IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_slot_overlap', 'conflict_reference', v_conflict_ref);
  END IF;

  UPDATE public.bookings
  SET status = 'confirmed'::booking_status,
      payment_status = 'success'::payment_status,
      payment_method = p_gateway,
      payment_id = p_payment_id,
      smart_lock_pin = p_pin,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_booking.id;

  -- Mark full overnight dates unavailable; same-day 12-hour bookings rely on time-slot overlap checks
  IF v_booking.check_out > v_booking.check_in THEN
    INSERT INTO public.property_availability (property_id, date, is_available)
    SELECT v_booking.property_id, d::date, false
    FROM generate_series(v_booking.check_in, v_booking.check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
    ON CONFLICT (property_id, date) DO UPDATE
      SET is_available = false, updated_at = timezone('utc'::text, now());
  END IF;

  RETURN jsonb_build_object('success', true, 'booking_reference', p_booking_ref);
END;
$$;
