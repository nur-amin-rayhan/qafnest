-- ============================================================================
-- Migration: 20261102000000_production_ready_guest_engine.sql
-- Description: Align schema, RLS policies, bookings, properties, availability,
--              favorites, reviews, RPC confirmation function, and seed properties.
-- ============================================================================

-- 1. Enum verification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('initiated', 'success', 'failed', 'refunded');
  END IF;
END $$;

-- 2. Align properties columns
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS host_id TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tourism_license_number TEXT;
-- This migration's sample catalog omits city/category in its insert lists, so
-- use safe defaults for those sample rows, then normalize city from city_name.
ALTER TABLE public.properties ALTER COLUMN city SET DEFAULT 'riyadh';
ALTER TABLE public.properties ALTER COLUMN category SET DEFAULT 'chalet';
-- The guest application consumes image arrays as JSON; normalize older TEXT[] schemas.
DO $$
DECLARE
  image_type TEXT;
BEGIN
  SELECT data_type INTO image_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'images';
  IF image_type = 'ARRAY' THEN
    ALTER TABLE public.properties ALTER COLUMN images TYPE JSONB USING to_jsonb(images);
    ALTER TABLE public.properties ALTER COLUMN images SET DEFAULT '[]'::jsonb;
  END IF;
END $$;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekday_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekend_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 4;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms_count INT DEFAULT 1;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS living_rooms_count INT DEFAULT 1;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS host_id TEXT;

-- 3. Align bookings columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_reference ON public.bookings(booking_reference);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS auth_subject TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 4. Property availability table
CREATE TABLE IF NOT EXISTS public.property_availability (
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  nightly_price NUMERIC(10, 2),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (property_id, date)
);

ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved property availability" ON public.property_availability;
CREATE POLICY "Anyone can view approved property availability"
ON public.property_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.properties
  WHERE properties.id = property_availability.property_id
    AND properties.is_approved = true
));

-- 5. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(guest_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guests can manage own favorites" ON public.favorites;
CREATE POLICY "Guests can manage own favorites"
ON public.favorites FOR ALL
USING (auth.uid() = guest_id);

-- 6. Reviews & Review Admins tables
CREATE TABLE IF NOT EXISTS public.review_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_subject TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  auth_subject TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  cleanliness_rating NUMERIC(3, 1) CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 10),
  accuracy_rating NUMERIC(3, 1) CHECK (accuracy_rating >= 1 AND accuracy_rating <= 10),
  communication_rating NUMERIC(3, 1) CHECK (communication_rating >= 1 AND communication_rating <= 10),
  location_rating NUMERIC(3, 1) CHECK (location_rating >= 1 AND location_rating <= 10),
  comment TEXT,
  host_reply TEXT,
  host_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

-- 7. Bookings RLS policies
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings"
ON public.bookings FOR SELECT
USING (
  auth.uid() = guest_id 
  OR (auth_subject IS NOT NULL AND auth_subject = auth.uid()::text)
  OR (auth.jwt() ->> 'phone_number' IS NOT NULL AND auth_subject = auth.jwt() ->> 'phone_number')
);

DROP POLICY IF EXISTS "Allow create pending bookings" ON public.bookings;
CREATE POLICY "Allow create pending bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  status = 'pending'::booking_status 
  AND payment_status = 'initiated'::payment_status 
  AND smart_lock_pin IS NULL
);

-- 8. Authoritative booking confirmation function (SECURITY DEFINER)
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
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE booking_reference = p_booking_ref;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  -- Replay check
  IF v_booking.status = 'confirmed' AND v_booking.payment_status = 'success' THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'booking_reference', p_booking_ref);
  END IF;

  -- Verify amount match (with 1 SAR tolerance for decimal rounding)
  IF ABS(v_booking.total_price - p_amount) > 1.0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_mismatch', 'expected', v_booking.total_price, 'received', p_amount);
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET
    status = 'confirmed'::booking_status,
    payment_status = 'success'::payment_status,
    payment_method = p_gateway,
    smart_lock_pin = p_pin,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_booking.id;

  -- Reserve dates in property_availability
  INSERT INTO public.property_availability (property_id, date, is_available)
  SELECT v_booking.property_id, d::date, false
  FROM generate_series(v_booking.check_in, v_booking.check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
  ON CONFLICT (property_id, date) DO UPDATE SET is_available = false, updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object('success', true, 'booking_reference', p_booking_ref);
END;
$$;

-- 9. Seed 46 Properties with deterministic UUIDs
-- Default Host ID: 333df1f6-b111-46ce-97f2-bf4865ed5f95 (Host Fahad)

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'ca944b90-0546-44be-8684-fd55e05fe14c', 'kidia-falcon-ridge', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Tuwaiq Falcon Ridge Chalet (Near Qiddiya)', 'Riyadh', 'Riyadh, Tuwaiq & Qiddiya View', 650,
  1300, 50, 8, 3,
  2, 420, true, true, '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '7c36a87f-e754-4dd3-8385-faa6a497d441', 'kidia-ammariyah-royal', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Al-Ammariyah Royal Chalet', 'Riyadh', 'Riyadh, Al-Ammariyah Valley', 580,
  890, 35, 6, 3,
  2, 420, true, true, '["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'e2929779-7205-4a77-8771-b274e9676d90', 'kidia-najd-palace', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Najd Sovereign Private Estate', 'Riyadh', 'Riyadh, West Tuwaiq Dist.', 1200,
  2000, 40, 14, 5,
  3, 850, true, true, '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'd6aad2c0-e2db-4a5f-862f-6f77666352e0', 'kidia-diriyah-oasis', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Diriyah Oasis Heritage Farm', 'Riyadh', 'Riyadh, Historical Diriyah', 850,
  1100, 23, 16, 4,
  2, 3500, true, true, '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&fit=crop","https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'b6885404-5f62-4a57-8165-3ac56298a9dc', 'kidia-hanifa-sunset', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Wadi Hanifa Sunset Chalet', 'Riyadh', 'Riyadh, Wadi Hanifa Dist.', 490,
  700, 30, 6, 2,
  2, 420, true, true, '["https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'b65ab357-3de0-4552-8358-39b8d001a616', 'kidia-tuwaiq-panorama', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Tuwaiq Panorama Luxury Villa', 'Riyadh', 'Riyadh, Al Hazm Dist.', 750,
  1250, 40, 10, 4,
  3, 850, true, true, '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '44d534b1-3b68-428e-8d5b-d8e28c0a8238', 'sea-unique-vibe', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Unique Vibe', 'Jeddah', 'Jeddah, Al Hamra Dist.', 5550,
  10550, 50, 2, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'a50143ea-3655-40b9-84ad-d1bba1e97bb9', 'sea-self-checkin-nuzhah', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Self-Check in', 'Jeddah', 'Jeddah, An Nuzhah Dist.', 274.72,
  357.22, 25, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'ce6e2792-4b23-451c-8853-d00ce4f00152', 'sea-two-bedroom-bawadi', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Two-Bedroom', 'Jeddah', 'Jeddah, Al Bawadi Dist.', 333,
  NULL, NULL, 5, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '403b5311-d9a5-48d7-89d4-2bd21ff3bab9', 'sea-self-checkin-muhammadiyah', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Self-Check in', 'Jeddah', 'Jeddah, Al Muhammadiyah Dist.', 720.39,
  1369.59, 50, 3, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&fit=crop","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'c94ec04b-d33a-4475-8f88-9b4224ca895e', 'sea-elegant-studio', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Elegant Design', 'Jeddah', 'Jeddah, Al Muhammadiyah Dist.', 5550,
  10550, 50, 2, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '966396b8-744c-4dfb-8e08-6cbe1ed7b077', 'sea-living-room-marwah', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Jeddah', 'Jeddah, Al Marwah Dist.', 221.11,
  270.91, 20, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '3107ebd9-4deb-4542-8e40-36c738410ccb', 'fog-outdoor-seating', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'chalet with outdoor seating', 'Abha', 'Abha, Qra al Ghlydh', 686.7,
  756.7, 10, 6, 2,
  2, 420, true, true, '["https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&fit=crop","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&fit=crop","https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&fit=crop","https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '6da77914-5d14-4600-85b1-91cbf73640ed', 'fog-living-room-mahalah-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living room', 'Abha', 'Abha, al mahalah', 134.86,
  148.36, 10, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'cccad964-fd48-483a-8870-f9e7b7fd970b', 'fog-two-bedroom-wasaif', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Two-Bedroom', 'Abha', 'Abha, Al Wasaif Dist.', 271.95,
  NULL, NULL, 5, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&fit=crop","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'cef5a33c-b856-48bb-87f2-bb3240e5345d', 'fog-living-room-mahalah-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Abha', 'Abha, al mahalah', 555,
  NULL, NULL, 6, 3,
  1, 280, true, true, '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'b8bec694-8ff7-405d-8478-367a9d3f373d', 'fog-three-bedroom-arin', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with 3 Bedroom', 'Abha', 'Abha, Al Arin Dist.', 277.5,
  NULL, NULL, 7, 3,
  1, 280, true, true, '["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '430c6560-0d6b-499d-865b-de891f398967', 'fog-one-bedroom-muathafin', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with One-Bedroom', 'Abha', 'Abha, al muathafin', 199.8,
  219.8, 10, 3, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&fit=crop","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '4da22cc5-6724-4138-8fb9-f38d53020d8d', 'roses-master-bed-sadad', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Master Bed', 'Taif', 'At Taif, As Sadad Dist.', 186.48,
  228.48, 20, 2, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '84d4e64e-e03c-4cb8-854c-510f69ed2b99', 'roses-two-bedroom-sarur', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Two-Bedroom', 'Taif', 'At Taif, As Sarur Dist.', 183.15,
  318.15, 45, 5, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'bcd5683d-0f3f-42b5-8062-c33fa04765b6', 'roses-living-room-jal-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Taif', 'At Taif, Al Jal Dist.', 155.4,
  NULL, NULL, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '2ca2458d-b246-4651-897a-57ab94a19c61', 'roses-master-bed-jal-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Master Bed', 'Taif', 'At Taif, Al Jal Dist.', 130.98,
  NULL, NULL, 2, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'fa0243f4-34c5-445b-817b-702a40d49a7f', 'roses-living-room-shifa', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Taif', 'At Taif, Ash Shifa Dist.', 943.5,
  NULL, NULL, 8, 4,
  3, 850, true, true, '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '2a6cd089-50e1-4f30-8e40-7751de228b20', 'roses-outdoor-seating-wesam', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Chalet with Outdoor Seating', 'Taif', 'At Taif, Al Wesam Dist.', 545,
  NULL, NULL, 6, 2,
  2, 420, true, true, '["https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&fit=crop","https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'ed65f87f-973a-46e0-8916-92c40effa0c9', 'deal-master-bed-hazm', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Master Bed', 'Riyadh', 'Riyadh, Al Hazm Dist.', 372.96,
  436.96, 16, 2, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '9dc26a77-de6c-4943-89e4-4e6ac21f50fa', 'deal-living-room-narjis-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Riyadh', 'Riyadh, Al Narjis Dist.', 333,
  633, 50, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '5d6e90a2-f2c5-4a95-8219-20c1a870bec5', 'deal-living-room-hitteen', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Riyadh', 'Riyadh, Hitteen Dist.', 333,
  633, 50, 5, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '01cc0b67-ed56-4496-8d00-34cf6e376207', 'deal-elegant-malqa', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Elegant Design', 'Riyadh', 'Riyadh, Al Malqa Dist.', 427.35,
  592.35, 30, 2, 1,
  1, 280, true, true, '["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '58abc9dc-4d85-47d6-803f-d8c65e26512c', 'deal-living-room-narjis-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Riyadh', 'Riyadh, Al Narjis Dist.', 420.69,
  799.69, 50, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '80ab0dee-2226-433f-8b7b-3e3a1fc7a5dc', 'deal-living-room-suwaidi', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Riyadh', 'Riyadh, West Suwaidi Dist.', 428.13,
  601.42, 31, 5, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'dfc01b84-a622-4995-80bc-0ca5af5fc3cf', 'general-alula-stargazing', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'AlUla Sky-Dome Desert Sanctuary', 'AlUla', 'AlUla, Sharaan Valley', 1650,
  NULL, NULL, 4, 2,
  1, 1200, true, true, '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&fit=crop","https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&fit=crop","https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'bfe94742-0ef1-49d0-8dc0-1b19bb9a754c', 'general-mecca-sky-residence', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Abraj Panoramic Holy Haram Suite', 'Mecca', 'Mecca, Central District', 3100,
  NULL, NULL, 6, 3,
  1, 280, true, true, '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '43f82994-89bc-467f-87e2-faed4f91d7b6', 'general-riyadh-kafd-penthouse', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'KAFD Executive High-Rise Penthouse', 'Riyadh', 'Riyadh, KAFD Financial Dist.', 2200,
  NULL, NULL, 4, 2,
  1, 280, true, true, '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&fit=crop","https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '4e894b2d-dc25-46d4-87d8-fd433f2433b7', 'general-khobar-azure', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Corniche Sky Penthouse & Jacuzzi', 'Al Khobar', 'Al Khobar, Prince Turki Coast', 2750,
  NULL, NULL, 6, 3,
  1, 280, true, true, '["https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'fef3aa8b-c000-423b-829e-529988127880', 'search-riyadh-yasmeen-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with living room', 'Riyadh', 'Riyadh, Al Yasmeen Dist.', 577.8,
  NULL, NULL, 5, 1,
  1, 85, true, true, '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'e59dd633-cdcc-48fe-8488-eab48ae50338', 'search-riyadh-sahafah-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with view of Riyadh', 'Riyadh', 'Riyadh, Al Sahafah Dist.', 1050,
  1105, 5, 2, 1,
  1, 90, true, true, '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'ae9cf11e-69f0-42d8-85b8-f6022082ad49', 'search-riyadh-aqeeq-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with backyard', 'Riyadh', 'Riyadh, Al Aqeeq Dist.', 1050,
  1105, 5, 5, 1,
  1, 80, true, true, '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'a8e5e03e-3677-4801-8f9c-24b607bc6bdd', 'search-riyadh-qurtubah-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with 1 Bedroom', 'Riyadh', 'Riyadh, Qurtubah Dist.', 1054.5,
  1189.65, 5, 6, 1,
  1, 80, true, true, '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '3bef62f7-4ec5-4788-8d46-07bd1d831e0a', 'search-riyadh-malqa-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with 1 Bedroom', 'Riyadh', 'Riyadh, Al Malqa Dist.', 1054.5,
  1189.65, 5, 6, 1,
  1, 90, true, true, '["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '8f551f04-153e-4851-8f95-81edec72aaeb', 'search-riyadh-aqeeq-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with 1 Bedroom', 'Riyadh', 'Riyadh, Al Aqeeq Dist.', 1100.51,
  1189.65, 5, 6, 1,
  1, 87, true, true, '["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'abd089eb-8b30-4c37-8679-e94d364cdf0e', 'search-riyadh-malqa-studio-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio With Master bed', 'Riyadh', 'Riyadh, Al Malqa Dist.', 253.08,
  285, 5, 2, 1,
  1, 44, true, true, '["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'd740bf96-8ac4-49d2-8558-eb6687349a89', 'search-riyadh-malqa-studio-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio With Master bed', 'Riyadh', 'Riyadh, Al Malqa Dist.', 225.55,
  234.78, 5, 2, 1,
  1, 47, true, true, '["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'b6a528bd-7208-4933-8b86-2b4d487ba840', 'search-riyadh-yasmeen-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with Living Room', 'Riyadh', 'Riyadh, Al Yasmeen Dist.', 304.53,
  314.78, 5, 5, 1,
  1, 80, true, true, '["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  '5d6a3ce1-4062-4c31-80ce-96d0afbf86df', 'search-riyadh-aqeeq-studio-1', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Master Bed', 'Riyadh', 'Riyadh, Al Aqeeq Dist.', 357.44,
  373.44, 5, 2, 1,
  1, 45, true, true, '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'edab37d2-5bb7-490e-8114-d1d9570af4a1', 'search-riyadh-aqeeq-apt-3', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Apartment with 1 Bedroom', 'Riyadh', 'Riyadh, Al Aqeeq Dist.', 316.35,
  373.33, 5, 6, 1,
  1, 55, true, true, '["https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, images
) VALUES (
  'f531d988-353a-4d32-8779-c2d52ef73ebf', 'search-riyadh-aqeeq-studio-2', '333df1f6-b111-46ce-97f2-bf4865ed5f95',
  'Studio with Master Bed', 'Riyadh', 'Riyadh, Al Aqeeq Dist.', 298.35,
  310.15, 5, 2, 1,
  1, 45, true, true, '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&fit=crop","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  city_name = EXCLUDED.city_name,
  district = EXCLUDED.district,
  base_price = EXCLUDED.base_price,
  capacity = EXCLUDED.capacity,
  bedrooms_count = EXCLUDED.bedrooms_count,
  living_rooms_count = EXCLUDED.living_rooms_count,
  area_sqm = EXCLUDED.area_sqm,
  is_approved = true,
  images = EXCLUDED.images;

-- Sample rows use compact insert lists and intentionally share a fixture host.
UPDATE public.properties
SET city = CASE lower(coalesce(city_name, 'riyadh'))
  WHEN 'makkah' THEN 'mecca'
  WHEN 'alula' THEN 'alula'
  WHEN 'jeddah' THEN 'jeddah'
  WHEN 'khobar' THEN 'khobar'
  WHEN 'abha' THEN 'abha'
  WHEN 'taif' THEN 'taif'
  WHEN 'dammam' THEN 'dammam'
  WHEN 'tabuk' THEN 'tabuk'
  WHEN 'buraidah' THEN 'buraidah'
  ELSE 'riyadh'
END,
category = CASE
  WHEN title ILIKE '%villa%' THEN 'villa'
  WHEN title ILIKE '%farm%' THEN 'farm'
  WHEN title ILIKE '%camp%' THEN 'camp'
  WHEN title ILIKE '%penthouse%' OR title ILIKE '%apartment%' OR title ILIKE '%studio%' THEN 'penthouse'
  ELSE 'chalet'
END,
status = 'approved'
WHERE host_id = '333df1f6-b111-46ce-97f2-bf4865ed5f95';

