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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS iqama TEXT,
  ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT 'national_id',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'الرياض',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nafath_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_national_id ON public.profiles(national_id);
CREATE INDEX IF NOT EXISTS idx_profiles_iqama ON public.profiles(iqama);

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
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  city_name TEXT,
  district TEXT,
  district_ar TEXT,
  category_name TEXT,
  specs TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  weekday_price NUMERIC(10, 2),
  weekend_price NUMERIC(10, 2),
  custom_day_pricing JSONB DEFAULT '{}'::jsonb,
  sunday_price NUMERIC(10, 2),
  monday_price NUMERIC(10, 2),
  tuesday_price NUMERIC(10, 2),
  wednesday_price NUMERIC(10, 2),
  thursday_price NUMERIC(10, 2),
  friday_price NUMERIC(10, 2),
  saturday_price NUMERIC(10, 2),
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

-- Keep existing deployments in sync with the listing fields consumed by the app.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS host_id TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tourism_license_number TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekday_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekend_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS capacity INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms_count INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS living_rooms_count INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkin_time TIME;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkout_time TIME;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
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
  checkin_time TIME DEFAULT '15:00',
  checkout_time TIME DEFAULT '12:00',
  total_nights INT NOT NULL DEFAULT 1,
  guests_count INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status booking_status DEFAULT 'pending'::booking_status NOT NULL,
  payment_status payment_status DEFAULT 'initiated'::payment_status NOT NULL,
  smart_lock_pin TEXT,
  coupon_code TEXT,
  coupon_discount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings" 
ON public.bookings FOR SELECT USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
-- Booking creation and payment status changes must come from a trusted server-side
-- gateway flow. Guests can read their own booking records but cannot mark one paid.

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

-- 8. Guest Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews"
ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guests can post reviews" ON public.reviews;
CREATE POLICY "Guests can post reviews"
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = guest_id);
-- Verified guest reviews: one public review per paid, completed booking.
-- Supports both Supabase Auth UUIDs and Firebase third-party JWT subjects.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS auth_subject TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.bookings ALTER COLUMN guest_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_coupon_code ON public.bookings (coupon_code) WHERE coupon_code IS NOT NULL;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_subject TEXT,
  ADD COLUMN IF NOT EXISTS guest_display_name TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS comment_ar TEXT,
  ADD COLUMN IF NOT EXISTS cleanliness_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS accuracy_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS checkin_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS value_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS services_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS property_state_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified_stay BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_ar TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_by TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS host_reply TEXT,
  ADD COLUMN IF NOT EXISTS host_reply_ar TEXT,
  ADD COLUMN IF NOT EXISTS host_reply_at TIMESTAMPTZ;

ALTER TABLE public.reviews ALTER COLUMN guest_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;

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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'sub') = guest_id::text
  OR (auth.jwt() ->> 'sub') = auth_subject
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Guests can post reviews" ON public.reviews;
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

-- ============================================================================
-- Coupons & Promotions Management
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

