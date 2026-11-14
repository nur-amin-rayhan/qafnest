-- ============================================================================
-- Migration: Add coupon tracking columns to bookings table
-- ============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bookings_coupon_code ON public.bookings (coupon_code) WHERE coupon_code IS NOT NULL;