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

