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
