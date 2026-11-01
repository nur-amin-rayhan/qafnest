-- Gathern-style public review experience: 10-point category averages and
-- optional Arabic originals for translated review and host-response text.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS comment_ar TEXT,
  ADD COLUMN IF NOT EXISTS services_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS property_state_rating NUMERIC(3, 1),
  ADD COLUMN IF NOT EXISTS admin_reply_ar TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_services_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_services_rating_check
      CHECK (services_rating IS NULL OR services_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_property_state_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_property_state_rating_check
      CHECK (property_state_rating IS NULL OR property_state_rating BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_translation_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_translation_length_check
      CHECK (
        (title_ar IS NULL OR char_length(title_ar) <= 120)
        AND (comment_ar IS NULL OR char_length(comment_ar) <= 3000)
        AND (admin_reply_ar IS NULL OR char_length(admin_reply_ar) <= 2000)
      );
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_review_summary(UUID);
CREATE FUNCTION public.get_review_summary(target_property_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  average_accuracy NUMERIC,
  average_cleanliness NUMERIC,
  average_services NUMERIC,
  average_property_state NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(ROUND(AVG(rating), 1), 0)::NUMERIC,
    ROUND(AVG(accuracy_rating), 1)::NUMERIC,
    ROUND(AVG(cleanliness_rating), 1)::NUMERIC,
    ROUND(AVG(services_rating), 1)::NUMERIC,
    ROUND(AVG(property_state_rating), 1)::NUMERIC
  FROM public.reviews
  WHERE property_id = target_property_id
    AND is_published = true
    AND is_sample = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_summary(UUID) TO anon, authenticated;
GRANT UPDATE (admin_reply_ar) ON public.reviews TO authenticated;
