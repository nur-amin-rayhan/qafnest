-- Apply this migration to existing Supabase projects.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district TEXT;
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

-- Guests must never set their own booking payment status or access PIN.
DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
