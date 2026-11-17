-- QafNest Combined Pending Supabase Migrations (UTF-8 Clean)
-- Paste entire file into Supabase SQL Editor and click Run.

-- ============================================================
-- MIGRATION: 20261104040000_promotions_and_coupons.sql
-- ============================================================
-- ============================================================================
-- Migration: Promotions, Discount Codes & Campaign Management
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

-- Index for instant lookup by coupon code
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_upper ON public.coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (is_active);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Guests can read active, non-expired coupons
DROP POLICY IF EXISTS "Guests can read active coupons" ON public.coupons;
CREATE POLICY "Guests can read active coupons"
ON public.coupons FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Platform settings table for global toggles (e.g. promo engine enabled)
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

-- Seed initial platform promo state
INSERT INTO public.platform_settings (key, value)
VALUES ('promotions_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed initial Kingdom vacation promotions
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

-- ============================================================
-- MIGRATION: 20261105000000_booking_coupons_columns.sql
-- ============================================================
-- ============================================================================
-- Migration: Add coupon tracking columns to bookings table
-- ============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bookings_coupon_code ON public.bookings (coupon_code) WHERE coupon_code IS NOT NULL;

-- ============================================================
-- MIGRATION: 20261107010000_atomic_coupon_increment.sql
-- ============================================================
-- Migration: Atomic Coupon Increment Function (SEC-07)
-- Prevents lost updates and race condition overconsumption on coupon usage limits.

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  UPDATE public.coupons
  SET used_count = coalesce(used_count, 0) + 1,
      updated_at = timezone('utc'::text, now())
  WHERE UPPER(code) = UPPER(p_code)
    AND (usage_limit IS NULL OR coalesce(used_count, 0) < usage_limit)
  RETURNING * INTO v_coupon;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = UPPER(p_code)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'usage_limit_reached');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'coupon_not_found');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'used_count', v_coupon.used_count);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_usage(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO authenticated, service_role;

-- ============================================================
-- MIGRATION: 20261108010000_time_slot_booking_availability.sql
-- ============================================================
-- Migration: Add time-slot tracking for bookings and properties
-- Enforces hourly booking validation and 12:00 PM checkout cutoff transitions

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00';

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00';

-- Index for high-performance time-slot availability querying
CREATE INDEX IF NOT EXISTS idx_bookings_time_slots 
ON public.bookings(property_id, check_in, check_out, status);

-- ============================================================
-- MIGRATION: 20261108020000_granular_7day_pricing.sql
-- ============================================================
-- Migration: Add granular 7-day pricing and custom day pricing to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS custom_day_pricing JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sunday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS monday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS tuesday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS wednesday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS thursday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS friday_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS saturday_price NUMERIC(10, 2);

-- Ensure property_availability has nightly_price column for date overrides
ALTER TABLE public.property_availability
  ADD COLUMN IF NOT EXISTS nightly_price NUMERIC(10, 2);

-- ============================================================
-- MIGRATION: 20261110000000_booking_slot_controls_and_concurrency.sql
-- ============================================================
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

-- ============================================================
-- MIGRATION: 20261114000000_bilingual_property_fields.sql
-- ============================================================
-- Add simultaneous English & Arabic bilingual columns for property listings
-- Safe & idempotent migration

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS district_ar TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_ar TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS street_ar TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Backfill *_ar columns for legacy rows whose existing text is primarily Arabic script
UPDATE public.properties
SET title_ar = title
WHERE title_ar IS NULL
  AND title IS NOT NULL
  AND title ~ E'[\u0600-\u06FF]';

UPDATE public.properties
SET description_ar = description
WHERE description_ar IS NULL
  AND description IS NOT NULL
  AND description ~ E'[\u0600-\u06FF]';

UPDATE public.properties
SET district_ar = district
WHERE district_ar IS NULL
  AND district IS NOT NULL
  AND district ~ E'[\u0600-\u06FF]';

UPDATE public.properties
SET address_ar = address
WHERE address_ar IS NULL
  AND address IS NOT NULL
  AND address ~ E'[\u0600-\u06FF]';

-- ============================================================
-- MIGRATION: 20261116010000_unified_persistence_and_rls_hardening.sql
-- ============================================================
-- Migration: 20261116010000_unified_persistence_and_rls_hardening.sql
-- Hardens RLS policies across properties, reviews, CMS tables, host_notifications,
-- adds shared cross-app state storage, and reconciles missing schema columns/enums.

-- 1. Cross-App Durable Shared State Store (replaces isolated Vercel /tmp JSON divergence)
CREATE TABLE IF NOT EXISTS public.platform_shared_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_shared_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_shared_state FROM anon, authenticated;

-- 2. Properties Missing Bilingual / Location Columns & Status Check
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state_ar TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.properties'::regclass
      AND conname = 'properties_status_check'
  ) THEN
    ALTER TABLE public.properties DROP CONSTRAINT properties_status_check;
  END IF;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- 3. Properties RLS & Moderation Trigger (hosts cannot self-approve or tamper ratings/ownership)
DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE TO authenticated
USING (host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'))
WITH CHECK (
  host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  AND is_approved = false
  AND status IN ('pending', 'rejected')
);

CREATE OR REPLACE FUNCTION public.guard_property_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
      RAISE EXCEPTION 'host_id cannot be reassigned by client updates';
    END IF;
    NEW.is_approved := false;
    IF OLD.status = 'approved' THEN
      NEW.status := 'pending';
    END IF;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.rating := OLD.rating;
    NEW.reviews_count := OLD.reviews_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_property_moderation_fields ON public.properties;
CREATE TRIGGER trg_guard_property_moderation_fields
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_property_moderation_fields();

-- 4. Reviews RLS Hardening (remove insecure OR true and arbitrary authenticated updates)
DROP POLICY IF EXISTS "Public can read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view published property reviews" ON public.reviews;
CREATE POLICY "Anyone can view published property reviews"
ON public.reviews FOR SELECT TO anon, authenticated
USING (is_published = true AND is_sample = false);

DROP POLICY IF EXISTS "Hosts and admins can reply to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can reply to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Hosts can reply to reviews on own properties" ON public.reviews;

CREATE POLICY "Hosts or allowlisted admins can reply to reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
  OR EXISTS (
    SELECT 1 FROM public.review_admins ra
    WHERE ra.auth_subject = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
  OR EXISTS (
    SELECT 1 FROM public.review_admins ra
    WHERE ra.auth_subject = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
);

CREATE OR REPLACE FUNCTION public.guard_review_update_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_rev_admin BOOLEAN := false;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.review_admins ra
    WHERE ra.auth_subject = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  ) INTO is_rev_admin;

  -- Preserve review ratings/text/ownership against arbitrary client tampering
  NEW.property_id := OLD.property_id;
  NEW.booking_id := OLD.booking_id;
  NEW.guest_id := OLD.guest_id;
  NEW.guest_subject := OLD.guest_subject;
  NEW.rating := OLD.rating;
  NEW.cleanliness_rating := OLD.cleanliness_rating;
  NEW.accuracy_rating := OLD.accuracy_rating;
  NEW.checkin_rating := OLD.checkin_rating;
  NEW.value_rating := OLD.value_rating;
  NEW.services_rating := OLD.services_rating;
  NEW.property_state_rating := OLD.property_state_rating;
  NEW.title := OLD.title;
  NEW.comment := OLD.comment;

  IF NOT is_rev_admin THEN
    NEW.is_published := OLD.is_published;
    NEW.is_sample := OLD.is_sample;
    NEW.admin_reply := OLD.admin_reply;
    NEW.admin_reply_ar := OLD.admin_reply_ar;
    NEW.admin_reply_by := OLD.admin_reply_by;
    NEW.admin_reply_at := OLD.admin_reply_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_review_update_columns ON public.reviews;
CREATE TRIGGER trg_guard_review_update_columns
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_review_update_columns();

-- 5. Booking Status Enum Expansion & Check-in Time Alignment
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'checked_in'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refund_requested'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_sadad'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refunded'; EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $$;

ALTER TABLE public.properties ALTER COLUMN checkin_time SET DEFAULT '16:00';

-- 6. Allow payout notifications without mandatory property_id / booking_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'host_notifications' AND column_name = 'property_id'
  ) THEN
    ALTER TABLE public.host_notifications ALTER COLUMN property_id DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'host_notifications' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE public.host_notifications ALTER COLUMN booking_id DROP NOT NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- 7. CMS Tables Read Policies (unblocks anon/authenticated SELECT when RLS is enabled)
DO $$
BEGIN
  IF to_regclass('public.cms_articles') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read published cms articles" ON public.cms_articles';
    EXECUTE 'CREATE POLICY "Public can read published cms articles" ON public.cms_articles FOR SELECT TO anon, authenticated USING (status = ''published'')';
  END IF;
  IF to_regclass('public.cms_seo_routes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read active cms seo routes" ON public.cms_seo_routes';
    EXECUTE 'CREATE POLICY "Public can read active cms seo routes" ON public.cms_seo_routes FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF to_regclass('public.cms_faqs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read active cms faqs" ON public.cms_faqs';
    EXECUTE 'CREATE POLICY "Public can read active cms faqs" ON public.cms_faqs FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

