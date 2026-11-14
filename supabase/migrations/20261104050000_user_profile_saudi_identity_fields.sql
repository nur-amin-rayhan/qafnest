-- Migration: Add Saudi Identity and Verification Fields to public.profiles
-- Supports Saudi National ID (10 digits starting with 1), Iqama (10 digits starting with 2),
-- Nafath SSO verification, and contact profile fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS iqama TEXT,
  ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT 'national_id',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'الرياض',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nafath_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reference TEXT;

-- Create lookup indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_profiles_national_id ON public.profiles(national_id);
CREATE INDEX IF NOT EXISTS idx_profiles_iqama ON public.profiles(iqama);

-- Add column comments for documentation
COMMENT ON COLUMN public.profiles.national_id IS 'Saudi Citizen National ID (10 digits starting with 1)';
COMMENT ON COLUMN public.profiles.iqama IS 'Saudi Resident Iqama ID (10 digits starting with 2)';
COMMENT ON COLUMN public.profiles.id_type IS 'Identification document type: national_id or iqama';
COMMENT ON COLUMN public.profiles.is_verified IS 'Whether identity has been verified via Nafath / Muqeem registry';

