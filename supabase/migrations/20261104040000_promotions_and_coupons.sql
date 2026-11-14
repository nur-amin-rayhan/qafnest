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