-- Move guest reviews from the legacy 5-point scale to Gathern-style 10-point scores.
-- Existing scores are doubled once so their relative meaning is preserved.

ALTER TABLE public.properties
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating TYPE NUMERIC(4, 2)
    USING (
      CASE WHEN rating <= 5 THEN rating * 2 ELSE rating END
    )::NUMERIC(4, 2);

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check,
  DROP CONSTRAINT IF EXISTS reviews_cleanliness_rating_check,
  DROP CONSTRAINT IF EXISTS reviews_accuracy_rating_check,
  DROP CONSTRAINT IF EXISTS reviews_checkin_rating_check,
  DROP CONSTRAINT IF EXISTS reviews_value_rating_check;

ALTER TABLE public.reviews
  ALTER COLUMN rating TYPE NUMERIC(3, 1)
    USING (rating * 2)::NUMERIC(3, 1),
  ALTER COLUMN cleanliness_rating TYPE NUMERIC(3, 1)
    USING (cleanliness_rating * 2)::NUMERIC(3, 1),
  ALTER COLUMN accuracy_rating TYPE NUMERIC(3, 1)
    USING (accuracy_rating * 2)::NUMERIC(3, 1),
  ALTER COLUMN checkin_rating TYPE NUMERIC(3, 1)
    USING (checkin_rating * 2)::NUMERIC(3, 1),
  ALTER COLUMN value_rating TYPE NUMERIC(3, 1)
    USING (value_rating * 2)::NUMERIC(3, 1);

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 10),
  ADD CONSTRAINT reviews_cleanliness_rating_check
    CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 10),
  ADD CONSTRAINT reviews_accuracy_rating_check
    CHECK (accuracy_rating IS NULL OR accuracy_rating BETWEEN 1 AND 10),
  ADD CONSTRAINT reviews_checkin_rating_check
    CHECK (checkin_rating IS NULL OR checkin_rating BETWEEN 1 AND 10),
  ADD CONSTRAINT reviews_value_rating_check
    CHECK (value_rating IS NULL OR value_rating BETWEEN 1 AND 10);

DROP POLICY IF EXISTS "Guests can review completed stays" ON public.reviews;
CREATE POLICY "Guests can review completed stays"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  is_sample = false
  AND is_published = true
  AND is_verified_stay = true
  AND booking_id IS NOT NULL
  AND guest_subject = (auth.jwt() ->> 'sub')
  AND (guest_id IS NULL OR guest_id::text = (auth.jwt() ->> 'sub'))
  AND char_length(title) BETWEEN 5 AND 120
  AND char_length(comment) BETWEEN 20 AND 3000
  AND rating BETWEEN 1 AND 10
  AND cleanliness_rating BETWEEN 1 AND 10
  AND accuracy_rating BETWEEN 1 AND 10
  AND checkin_rating BETWEEN 1 AND 10
  AND value_rating BETWEEN 1 AND 10
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS booking
    WHERE booking.id = reviews.booking_id
      AND booking.property_id = reviews.property_id
      AND (
        booking.guest_id::text = (auth.jwt() ->> 'sub')
        OR booking.auth_subject = (auth.jwt() ->> 'sub')
      )
      AND booking.status = 'completed'::booking_status
      AND booking.payment_status = 'success'::payment_status
      AND booking.check_out <= timezone('Asia/Riyadh', now())::date
  )
);

DROP FUNCTION IF EXISTS public.get_review_summary(UUID);
CREATE FUNCTION public.get_review_summary(target_property_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  one_star BIGINT,
  two_star BIGINT,
  three_star BIGINT,
  four_star BIGINT,
  five_star BIGINT,
  six_star BIGINT,
  seven_star BIGINT,
  eight_star BIGINT,
  nine_star BIGINT,
  ten_star BIGINT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(ROUND(AVG(rating), 1), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE ROUND(rating) = 1)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 2)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 3)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 4)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 5)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 6)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 7)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 8)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 9)::BIGINT,
    COUNT(*) FILTER (WHERE ROUND(rating) = 10)::BIGINT
  FROM public.reviews
  WHERE property_id = target_property_id
    AND is_published = true
    AND is_sample = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_summary(UUID) TO anon, authenticated;
