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
