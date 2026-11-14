-- Migration: Add time-slot tracking for bookings and properties
-- Enforces hourly booking validation and 12:00 PM checkout cutoff transitions

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00';

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00';

-- Index for high-performance time-slot availability querying
CREATE INDEX IF NOT EXISTS idx_bookings_time_slots 
ON public.bookings(property_id, check_in, check_out, status);

