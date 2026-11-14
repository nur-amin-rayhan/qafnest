-- ============================================================================
-- QAFNEST COMPLETE DATABASE SETUP SCRIPT
-- Project: tlxifnctyylblzcsawvv.supabase.co
-- Generated: 2026-11-03
-- ============================================================================
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Paste & Run
-- ============================================================================

-- ============================================================
-- QAFNEST GUEST PLATFORM SUPABASE SCHEMA (qafnest.vercel.app)
-- ============================================================
-- Note: Host management and listings are managed on the separate
-- Host Platform (business.qafnest.vercel.app).
-- This database stores guest accounts, guest bookings, reviews,
-- favorites, and synchronized read-only property listings.
-- ============================================================

-- 1. Custom ENUM types for Guest Platform
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('initiated', 'success', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Guest Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  national_id TEXT,
  iqama TEXT,
  id_type TEXT DEFAULT 'national_id',
  city TEXT DEFAULT 'الرياض',
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  nafath_verified_at TIMESTAMPTZ,
  verification_reference TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_national_id ON public.profiles(national_id);
CREATE INDEX IF NOT EXISTS idx_profiles_iqama ON public.profiles(iqama);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert for profiles" ON public.profiles;
CREATE POLICY "Allow insert for profiles" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Automatic Profile Creation Trigger on Guest Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    national_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    NEW.raw_user_meta_data->>'national_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    national_id = EXCLUDED.national_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Properties Catalog (Read-Only for Guests; Synced from Host Platform)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  host_id TEXT,
  external_host_id TEXT, -- Reference to host on business.qafnest.vercel.app
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT DEFAULT 'chalet',
  city TEXT DEFAULT 'Riyadh',
  city_name TEXT,
  district TEXT,
  district_ar TEXT,
  category_name TEXT,
  specs TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  weekday_price NUMERIC(10, 2),
  weekend_price NUMERIC(10, 2),
  original_price NUMERIC(10, 2),
  discount_percentage NUMERIC(5, 2),
  images JSONB DEFAULT '[]'::jsonb,
  features TEXT[] DEFAULT '{}',
  rating NUMERIC(4, 2),
  reviews_count INT DEFAULT 0,
  instant_book BOOLEAN DEFAULT true,
  has_pool BOOLEAN DEFAULT false,
  self_checkin BOOLEAN DEFAULT true,
  is_licensed BOOLEAN DEFAULT false,
  capacity INT,
  bedrooms_count INT,
  living_rooms_count INT,
  checkin_time TIME,
  checkout_time TIME,
  area_sqm NUMERIC(10, 2),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  address_ar TEXT,
  street TEXT,
  street_ar TEXT,
  postal_code TEXT,
  admin_feedback TEXT,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  tourism_license_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
CREATE POLICY "Anyone can view approved properties" 
ON public.properties FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE TO authenticated
USING (host_id = (auth.jwt() ->> 'sub'))
WITH CHECK (host_id = (auth.jwt() ->> 'sub'));

-- Note: Properties are inserted/updated via service_role API sync from Host Platform

-- 5a. Per-night inventory and optional pricing overrides synced from the Host Platform.
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

-- 6. Guest Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_reference TEXT UNIQUE DEFAULT ('QAF-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  auth_subject TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_nights INT NOT NULL DEFAULT 1,
  guests_count INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status booking_status DEFAULT 'pending'::booking_status NOT NULL,
  payment_status payment_status DEFAULT 'initiated'::payment_status NOT NULL,
  payment_id TEXT,
  payment_method TEXT,
  smart_lock_pin TEXT,
  coupon_code TEXT,
  coupon_discount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_coupon_code ON public.bookings (coupon_code) WHERE coupon_code IS NOT NULL;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'sub') = guest_id::text
  OR (auth.jwt() ->> 'sub') = auth_subject
);

DROP POLICY IF EXISTS "Allow create pending bookings" ON public.bookings;
CREATE POLICY "Allow create pending bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  status = 'pending'::booking_status 
  AND payment_status = 'initiated'::payment_status 
  AND smart_lock_pin IS NULL
);

-- 7. Guest Wishlists / Favorites Table
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
ON public.favorites FOR ALL USING (auth.uid() = guest_id);

-- 8. Guest Reviews Table (Verified stays: one review per completed booking)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_subject TEXT,
  guest_display_name TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  title_ar TEXT,
  comment TEXT,
  comment_ar TEXT,
  cleanliness_rating NUMERIC(3, 1),
  accuracy_rating NUMERIC(3, 1),
  checkin_rating NUMERIC(3, 1),
  value_rating NUMERIC(3, 1),
  services_rating NUMERIC(3, 1),
  property_state_rating NUMERIC(3, 1),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  is_verified_stay BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  admin_reply TEXT,
  admin_reply_ar TEXT,
  admin_reply_by TEXT,
  admin_reply_at TIMESTAMPTZ,
  host_reply TEXT,
  host_reply_ar TEXT,
  host_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.review_admins (
  auth_subject TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.review_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review admins can read their own access" ON public.review_admins;
CREATE POLICY "Review admins can read their own access"
ON public.review_admins FOR SELECT TO authenticated
USING (auth_subject = (auth.jwt() ->> 'sub'));
REVOKE ALL ON public.review_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.review_admins TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_title_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_title_length_check
      CHECK (title IS NULL OR char_length(title) BETWEEN 5 AND 120);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_comment_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_comment_length_check
      CHECK (comment IS NULL OR char_length(comment) BETWEEN 20 AND 3000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_cleanliness_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_cleanliness_rating_check
      CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_accuracy_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_accuracy_rating_check
      CHECK (accuracy_rating IS NULL OR accuracy_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_checkin_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_checkin_rating_check
      CHECK (checkin_rating IS NULL OR checkin_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_value_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_value_rating_check
      CHECK (value_rating IS NULL OR value_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_admin_reply_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_admin_reply_length_check
      CHECK (admin_reply IS NULL OR char_length(admin_reply) BETWEEN 5 AND 2000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_admin_reply_metadata_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_admin_reply_metadata_check
      CHECK (
        (admin_reply IS NULL AND admin_reply_by IS NULL AND admin_reply_at IS NULL)
        OR (admin_reply IS NOT NULL AND admin_reply_by IS NOT NULL AND admin_reply_at IS NOT NULL)
      );
  END IF;
END $$;

DROP POLICY IF EXISTS "Public can read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Guests can review completed stays" ON public.reviews;
CREATE POLICY "Public can read published reviews"
ON public.reviews FOR SELECT TO anon, authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "Review admins can view all published reviews" ON public.reviews;
CREATE POLICY "Review admins can view all published reviews"
ON public.reviews FOR SELECT TO authenticated
USING (
  is_published = true
  AND is_sample = false
  AND EXISTS (SELECT 1 FROM public.review_admins AS admin WHERE admin.auth_subject = (auth.jwt() ->> 'sub'))
);

CREATE POLICY "Guests can review completed stays"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  is_sample = false
  AND is_published = true
  AND is_verified_stay = true
  AND booking_id IS NOT NULL
  AND guest_subject = (auth.jwt() ->> 'sub')
  AND (guest_id IS NULL OR guest_id::text = (auth.jwt() ->> 'sub'))
  AND char_length(title) BETWEEN 5 AND 120
  AND char_length(comment) BETWEEN 20 AND 3000
  AND rating BETWEEN 1 AND 10
  AND cleanliness_rating BETWEEN 1 AND 10
  AND accuracy_rating BETWEEN 1 AND 10
  AND checkin_rating BETWEEN 1 AND 10
  AND value_rating BETWEEN 1 AND 10
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS booking
    WHERE booking.id = reviews.booking_id
      AND booking.property_id = reviews.property_id
      AND (
        booking.guest_id::text = (auth.jwt() ->> 'sub')
        OR booking.auth_subject = (auth.jwt() ->> 'sub')
      )
      AND (
        booking.status = 'completed'::booking_status
        OR (
          booking.status = 'confirmed'::booking_status
          AND booking.check_out <= timezone('Asia/Riyadh', now())::date
        )
      )
      AND booking.payment_status = 'success'::payment_status
      AND booking.check_out <= timezone('Asia/Riyadh', now())::date
  )
);

DROP POLICY IF EXISTS "Review admins can reply to published reviews" ON public.reviews;
CREATE POLICY "Review admins can reply to published reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (
  is_published = true
  AND is_sample = false
  AND EXISTS (SELECT 1 FROM public.review_admins AS admin WHERE admin.auth_subject = (auth.jwt() ->> 'sub'))
)
WITH CHECK (
  is_published = true
  AND is_sample = false
  AND EXISTS (SELECT 1 FROM public.review_admins AS admin WHERE admin.auth_subject = (auth.jwt() ->> 'sub'))
);

DROP POLICY IF EXISTS "Hosts can view reviews for their properties" ON public.reviews;
CREATE POLICY "Hosts can view reviews for their properties"
ON public.reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND p.host_id = (auth.jwt() ->> 'sub')
  )
  OR is_published = true
);

DROP POLICY IF EXISTS "Hosts can reply to reviews on their properties" ON public.reviews;
CREATE POLICY "Hosts can reply to reviews on their properties"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND (p.host_id = (auth.jwt() ->> 'sub') OR p.host_id = '00000000-0000-0000-0000-000000000002')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND (p.host_id = (auth.jwt() ->> 'sub') OR p.host_id = '00000000-0000-0000-0000-000000000002')
  )
);

REVOKE UPDATE ON public.reviews FROM PUBLIC, anon, authenticated;
GRANT UPDATE (admin_reply, admin_reply_ar, admin_reply_by, admin_reply_at, host_reply, host_reply_ar, host_reply_at) ON public.reviews TO authenticated;

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  voter_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (review_id, voter_subject)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guests can read own helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Guests can vote helpful once" ON public.review_helpful_votes;
CREATE POLICY "Guests can read own helpful votes"
ON public.review_helpful_votes FOR SELECT TO authenticated
USING (voter_subject = (auth.jwt() ->> 'sub'));
CREATE POLICY "Guests can vote helpful once"
ON public.review_helpful_votes FOR INSERT TO authenticated
WITH CHECK (
  voter_subject = (auth.jwt() ->> 'sub')
  AND EXISTS (
    SELECT 1
    FROM public.reviews AS review
    WHERE review.id = review_helpful_votes.review_id
      AND review.is_published = true
      AND review.guest_subject IS DISTINCT FROM voter_subject
      AND (review.guest_id IS NULL OR review.guest_id::text <> voter_subject)
  )
);

CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;

  UPDATE public.reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS update_review_helpful_count_after_vote ON public.review_helpful_votes;
CREATE TRIGGER update_review_helpful_count_after_vote
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

DROP FUNCTION IF EXISTS public.get_review_summary(UUID);
CREATE FUNCTION public.get_review_summary(target_property_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  average_accuracy NUMERIC,
  average_cleanliness NUMERIC,
  average_services NUMERIC,
  average_property_state NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(ROUND(AVG(rating), 1), 0)::NUMERIC,
    ROUND(AVG(accuracy_rating), 1)::NUMERIC,
    ROUND(AVG(cleanliness_rating), 1)::NUMERIC,
    ROUND(AVG(services_rating), 1)::NUMERIC,
    ROUND(AVG(property_state_rating), 1)::NUMERIC
  FROM public.reviews
  WHERE property_id = target_property_id
    AND is_published = true
    AND is_sample = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_summary(UUID) TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.review_helpful_votes TO authenticated;


-- Additional Authoritative Functions & RLS Alignment
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

  IF v_booking.status = 'confirmed' AND v_booking.payment_status = 'success' THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'booking_reference', p_booking_ref);
  END IF;

  IF ABS(v_booking.total_price - p_amount) > 1.0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_mismatch', 'expected', v_booking.total_price, 'received', p_amount);
  END IF;

  UPDATE public.bookings
  SET
    status = 'confirmed'::booking_status,
    payment_status = 'success'::payment_status,
    payment_method = p_gateway,
    smart_lock_pin = p_pin,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_booking.id;

  INSERT INTO public.property_availability (property_id, date, is_available)
  SELECT v_booking.property_id, d::date, false
  FROM generate_series(v_booking.check_in, v_booking.check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
  ON CONFLICT (property_id, date) DO UPDATE SET is_available = false, updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object('success', true, 'booking_reference', p_booking_ref);
END;
$$;

-- ============================================================================
-- Coupons & Promotions Management Engine
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  min_spend NUMERIC(10, 2) DEFAULT 0,
  max_discount NUMERIC(10, 2),
  min_nights INT DEFAULT 1,
  usage_limit INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description_en TEXT,
  description_ar TEXT,
  starts_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_upper ON public.coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (is_active);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can read active coupons" ON public.coupons;
CREATE POLICY "Guests can read active coupons"
ON public.coupons FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;
CREATE POLICY "Public can read platform settings"
ON public.platform_settings FOR SELECT
USING (true);

INSERT INTO public.platform_settings (key, value)
VALUES ('promotions_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.coupons (code, type, value, min_spend, max_discount, min_nights, usage_limit, used_count, is_active, description_en, description_ar, expires_at)
VALUES
  ('QAF10', 'percentage', 10.00, 200.00, 350.00, 1, 1000, 42, true, '10% off entire booking (up to SAR 350)', 'خصم 10% على إجمالي الحجز (بحد أقصى 350 ر.س)', '2026-12-31 23:59:59+03'),
  ('WELCOME50', 'fixed', 50.00, 250.00, NULL, 1, 500, 89, true, 'SAR 50 welcome discount for new guests', 'خصم ترحيبي بقيمة 50 ر.س للنزلاء الجدد', '2026-12-31 23:59:59+03'),
  ('CHALET15', 'percentage', 15.00, 600.00, 500.00, 1, 300, 15, true, '15% off luxury chalets and private villas', 'خصم 15% على الشاليهات والفلل الفاخرة', '2026-12-31 23:59:59+03'),
  ('EID2026', 'fixed', 150.00, 750.00, NULL, 2, 200, 64, true, 'SAR 150 holiday discount on 2+ night stays', 'خصم 150 ر.س على الإقامات لمدة ليلتين أو أكثر', '2026-12-31 23:59:59+03'),
  ('SAUDI2026', 'percentage', 20.00, 1000.00, 600.00, 1, 150, 12, true, '20% celebration discount on premium estates', 'خصم 20% احتفالي على العقارات والمنتجعات المميزة', '2026-12-31 23:59:59+03')
ON CONFLICT (code) DO UPDATE
SET
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  min_spend = EXCLUDED.min_spend,
  max_discount = EXCLUDED.max_discount,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar;

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

-- ============================================================================
-- 10. Seed Realistic Host Analytics, Bookings & Verified Reviews
-- ============================================================================

-- Ensure dev host sample properties exist in properties catalog
INSERT INTO public.properties (
  id, slug, host_id, title, city_name, district, base_price,
  original_price, discount_percentage, capacity, bedrooms_count,
  living_rooms_count, area_sqm, is_approved, is_licensed, status, images
) VALUES
(
  'e1e1e1e1-1111-4111-8111-111111111111', 'narjis-premium-chalet-pool', '00000000-0000-0000-0000-000000000002',
  'Al-Narjis Premium Chalet & Pool', 'Riyadh', 'Al-Narjis District', 850,
  1100, 22, 6, 2,
  2, 350, true, true, 'approved', '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop","https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop"]'::jsonb
),
(
  '1e0e897d-9fec-43c2-a0fd-cefe527d1fc2', 'ammariyah-sunset-oasis', '00000000-0000-0000-0000-000000000002',
  'Al-Ammariyah Sunset Oasis Chalet', 'Riyadh', 'Al-Ammariyah Valley', 950,
  1350, 30, 8, 3,
  2, 480, true, true, 'approved', '["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop"]'::jsonb
),
(
  'e3e3e3e3-3333-4333-8333-333333333333', 'obhur-bay-beachfront-haven', '00000000-0000-0000-0000-000000000002',
  'Obhur Bay Beachfront Haven', 'Jeddah', 'Obhur Creek Marina', 1250,
  1750, 28, 10, 4,
  3, 550, true, true, 'approved', '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  host_id = EXCLUDED.host_id,
  is_approved = true,
  status = 'approved',
  images = EXCLUDED.images;

-- Associate chalets & villas with the dev host (00000000-0000-0000-0000-000000000002) for dashboard analytics
UPDATE public.properties
SET host_id = '00000000-0000-0000-0000-000000000002',
    is_approved = true,
    status = 'approved'
WHERE id IN (
  'e1e1e1e1-1111-4111-8111-111111111111', -- Al-Narjis Premium Chalet & Pool
  '1e0e897d-9fec-43c2-a0fd-cefe527d1fc2', -- Al-Ammariyah Sunset Oasis Chalet
  'e3e3e3e3-3333-4333-8333-333333333333', -- Obhur Bay Beachfront Haven
  '7c36a87f-e754-4dd3-8385-faa6a497d441', -- Al-Ammariyah Royal Chalet
  'b6885404-5f62-4a57-8165-3ac56298a9dc'  -- Wadi Hanifa Sunset Chalet
);

-- Seed realistic host bookings with different statuses (confirmed/paid, pending, past, upcoming)
INSERT INTO public.bookings (
  id, booking_reference, property_id, guest_id, auth_subject, check_in, check_out, total_nights,
  guests_count, total_price, status, payment_status, payment_id, payment_method, smart_lock_pin, created_at
) VALUES
-- Confirmed & Paid: Active/Upcoming Booking 1 (Al-Narjis)
(
  'a1111111-1111-4111-8111-111111111111',
  'QAF-982144',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966501234567',
  CURRENT_DATE + INTERVAL '2 day',
  CURRENT_DATE + INTERVAL '5 day',
  3,
  6,
  2550.00,
  'confirmed',
  'success',
  'pay_live_narjis_01',
  'mada',
  '9842',
  NOW() - INTERVAL '1 day'
),
-- Confirmed & Paid: Checked-in Today (Al-Ammariyah Sunset)
(
  'a2222222-2222-4222-8222-222222222222',
  'QAF-441829',
  '1e0e897d-9fec-43c2-a0fd-cefe527d1fc2',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966559876543',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 day',
  2,
  4,
  1900.00,
  'confirmed',
  'success',
  'pay_live_ammar_02',
  'tabby',
  '5519',
  NOW() - INTERVAL '3 day'
),
-- Confirmed & Paid: Upcoming Weekend (Obhur Bay)
(
  'a3333333-3333-4333-8333-333333333333',
  'QAF-773120',
  'e3e3e3e3-3333-4333-8333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966567890123',
  CURRENT_DATE + INTERVAL '7 day',
  CURRENT_DATE + INTERVAL '10 day',
  3,
  8,
  3750.00,
  'confirmed',
  'success',
  'pay_live_obhur_03',
  'visa',
  '7310',
  NOW() - INTERVAL '2 day'
),
-- Confirmed & Completed: Past Stay (Al-Narjis)
(
  'a4444444-4444-4444-8444-444444444444',
  'QAF-120934',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966541122334',
  CURRENT_DATE - INTERVAL '14 day',
  CURRENT_DATE - INTERVAL '11 day',
  3,
  5,
  2400.00,
  'confirmed',
  'success',
  'pay_live_past_04',
  'mada',
  '1209',
  NOW() - INTERVAL '16 day'
),
-- Confirmed & Completed: Past Stay (Al-Ammariyah Royal)
(
  'a5555555-5555-4555-8555-555555555555',
  'QAF-882319',
  '7c36a87f-e754-4dd3-8385-faa6a497d441',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966532233445',
  CURRENT_DATE - INTERVAL '22 day',
  CURRENT_DATE - INTERVAL '19 day',
  3,
  10,
  4500.00,
  'confirmed',
  'success',
  'pay_live_past_05',
  'mastercard',
  '8823',
  NOW() - INTERVAL '25 day'
),
-- Pending Host Approval Request
(
  'a6666666-6666-4666-8666-666666666666',
  'QAF-339182',
  'b6885404-5f62-4a57-8165-3ac56298a9dc',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966598877665',
  CURRENT_DATE + INTERVAL '12 day',
  CURRENT_DATE + INTERVAL '14 day',
  2,
  4,
  1600.00,
  'pending',
  'initiated',
  NULL,
  'mada',
  NULL,
  NOW() - INTERVAL '2 hour'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  total_price = EXCLUDED.total_price;

-- Seed realistic guest reviews for host properties with host replies
INSERT INTO public.reviews (
  id, property_id, guest_id, booking_id, guest_display_name, rating,
  title, title_ar, comment, comment_ar,
  cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating,
  is_verified_stay, is_published, host_reply, host_reply_ar, host_reply_at, created_at
) VALUES
-- Review 1 (Al-Narjis Chalet): 5 stars with host reply
(
  'r1111111-1111-4111-8111-111111111111',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'a4444444-4444-4444-8444-444444444444',
  'عبدالرحمن السبيعي (Abdulrahman)',
  9.8,
  'Exceptional stay, heated pool was pristine!',
  'إقامة استثنائية والمسبح المدفأ نظيف جداً وممتع للعائلة',
  'The chalet was spotless, exactly as shown in photos. Smart lock check-in was seamless and the host was very responsive.',
  'الشاليه قمة في النظافة ومطابق للصور تماماً. الدخول الذكي برمز القفل كان سهلاً جداً والمضيف كان سريع التجاوب ومتعاوناً.',
  10.0, 10.0, 9.8, 9.5, 9.7, 10.0,
  true, true,
  'Thank you Abdulrahman! It was a pleasure hosting you and your family. You are always welcome at QafNest.',
  'أهلاً بك يا أبا محمد، سعدنا باستضافتكم الكريمة وتشرفنا بكم، ومرحباً بكم دائماً في قاف نست!',
  NOW() - INTERVAL '8 day',
  NOW() - INTERVAL '9 day'
),
-- Review 2 (Al-Ammariyah Royal Chalet): 4.8 stars
(
  'r2222222-2222-4222-8222-222222222222',
  '7c36a87f-e754-4dd3-8385-faa6a497d441',
  '00000000-0000-0000-0000-000000000001',
  'a5555555-5555-4555-8555-555555555555',
  'نورة القحطاني (Noura Al-Qahtani)',
  9.5,
  'Breathtaking sunset view and royal comfort',
  'إطلالة ساحرة وقت الغروب وأجواء ملكية راقية',
  'Huge estate with top tier privacy. The outdoor majlis and lighting at night were spectacular for our family gathering.',
  'المكان واسع جداً ويوفر خصوصية تامة للعائلة. الجلسة الخارجية والإنارة ليلاً كانت رائعة ومميزة للمناسبات.',
  9.6, 9.5, 9.8, 9.2, 9.5, 9.4,
  true, true,
  NULL, NULL, NULL,
  NOW() - INTERVAL '15 day'
),
-- Review 3 (Obhur Bay): 5 stars
(
  'r3333333-3333-4333-8333-333333333333',
  'e3e3e3e3-3333-4333-8333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'خالد الشمري (Khaled Al-Shammari)',
  9.2,
  'Great seaside experience',
  'تجربة بحرية مميزة وموقع هادئ',
  'Direct view of the bay. Kids enjoyed the water activities and the AC cooling was super strong.',
  'إطلالة مباشرة على الخليج والأطفال استمتعوا جداً، التكييف ممتاز ونظافة ممتازة.',
  9.0, 9.2, 9.5, 9.0, 9.3, 9.2,
  true, true,
  'Glad you enjoyed your stay by the sea Khaled! See you next season.',
  'سعدنا جداً بإعجابكم بالفيلا الشاطئية يا خالد، نتطلع لاستضافتكم في عطلاتكم القادمة بإذن الله.',
  NOW() - INTERVAL '20 day',
  NOW() - INTERVAL '22 day'
)
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  cleanliness_rating = EXCLUDED.cleanliness_rating,
  host_reply = EXCLUDED.host_reply,
  host_reply_ar = EXCLUDED.host_reply_ar;