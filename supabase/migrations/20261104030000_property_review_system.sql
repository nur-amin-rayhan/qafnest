-- Migration: 20261104030000_property_review_system.sql
-- Adds admin feedback and rejection tracking columns to public.properties

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Update RLS policies so hosts can view and update their own pending/rejected properties
DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE TO authenticated
USING (host_id = (auth.jwt() ->> 'sub'))
WITH CHECK (host_id = (auth.jwt() ->> 'sub'));
