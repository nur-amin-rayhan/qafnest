-- ==============================================================================
-- CMS AND PLATFORM EXTENSIONS MIGRATION (RUN IN SUPABASE SQL EDITOR)
-- Project: https://tlxifnctyylblzcsawvv.supabase.co
-- ==============================================================================

-- 1. CMS Blog Articles Table
CREATE TABLE IF NOT EXISTS public.cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Chalets & Resorts',
  status TEXT NOT NULL DEFAULT 'published',
  views INTEGER DEFAULT 0,
  meta_description TEXT,
  content_en TEXT,
  content_ar TEXT,
  featured_image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CMS SEO Routes Table
CREATE TABLE IF NOT EXISTS public.cms_seo_routes (
  route_path TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  keywords TEXT,
  og_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CMS FAQs Table
CREATE TABLE IF NOT EXISTS public.cms_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  answer_en TEXT,
  answer_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS and grants
ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_seo_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.cms_articles TO service_role, postgres;
GRANT SELECT ON public.cms_articles TO anon, authenticated;
DROP POLICY IF EXISTS "Public can read published cms articles" ON public.cms_articles;
CREATE POLICY "Public can read published cms articles"
  ON public.cms_articles FOR SELECT TO anon, authenticated
  USING (status = 'published');

GRANT ALL ON public.cms_seo_routes TO service_role, postgres;
GRANT SELECT ON public.cms_seo_routes TO anon, authenticated;
DROP POLICY IF EXISTS "Public can read active cms seo routes" ON public.cms_seo_routes;
CREATE POLICY "Public can read active cms seo routes"
  ON public.cms_seo_routes FOR SELECT TO anon, authenticated
  USING (true);

GRANT ALL ON public.cms_faqs TO service_role, postgres;
GRANT SELECT ON public.cms_faqs TO anon, authenticated;
DROP POLICY IF EXISTS "Public can read active cms faqs" ON public.cms_faqs;
CREATE POLICY "Public can read active cms faqs"
  ON public.cms_faqs FOR SELECT TO anon, authenticated
  USING (true);

-- 5. Seed initial SEO Routes & Articles if empty
INSERT INTO public.cms_seo_routes (route_path, title_en, title_ar, keywords, og_image)
VALUES
  ('/', 'QafNest | Saudi Chalets, Resorts & Luxury Stays', 'قاف نست | شاليهات ومنتجعات واستراحات المملكة', 'chalets riyadh, resorts jeddah, alula desert camps, qafnest booking', 'https://qafnest.com/og-home.jpg'),
  ('/chalets/riyadh', 'Luxury Chalets & Private Pools in Riyadh | QafNest', 'شاليهات فاخرة ومسابح خاصة في الرياض | قاف نست', 'riyadh chalets, private pool riyadh, luxury stays riyadh', 'https://qafnest.com/og-riyadh.jpg'),
  ('/alula', 'Exclusive AlUla Desert Camps & Eco Lodges | QafNest', 'مخيمات ومنتجعات العلا الفاخرة | قاف نست', 'alula desert resorts, luxury camping alula, hegra stays', 'https://qafnest.com/og-alula.jpg')
ON CONFLICT (route_path) DO NOTHING;

INSERT INTO public.cms_articles (title_en, title_ar, slug, category, status, views, meta_description)
VALUES
  ('Top 10 Luxury Chalets in Riyadh with Heated Pools', 'أفضل ١٠ شاليهات فاخرة في الرياض بمسبح مدفأ', 'top-10-luxury-chalets-riyadh', 'Chalets & Resorts', 'published', 3420, 'Discover the most exclusive luxury chalets and private pool retreats in Riyadh.'),
  ('AlUla Winter Desert Camping Guide 2026', 'دليل التخييم الشتوي في العلا ٢٠٢٦', 'alula-winter-desert-camping-2026', 'Desert Camps', 'published', 5190, 'A complete guide to booking stargazing dome tents and luxury desert camps in AlUla.')
ON CONFLICT (slug) DO NOTHING;
