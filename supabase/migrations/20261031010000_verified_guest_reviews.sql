-- Verified guest reviews: one public review per paid, completed booking.
-- Supports both Supabase Auth UUIDs and Firebase third-party JWT subjects.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS auth_subject TEXT;
ALTER TABLE public.bookings ALTER COLUMN guest_id DROP NOT NULL;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_subject TEXT,
  ADD COLUMN IF NOT EXISTS guest_display_name TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS cleanliness_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS accuracy_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS checkin_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS value_rating SMALLINT,
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified_stay BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.reviews ALTER COLUMN guest_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_title_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_title_length_check
      CHECK (title IS NULL OR char_length(title) BETWEEN 5 AND 120);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_comment_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_comment_length_check
      CHECK (comment IS NULL OR char_length(comment) BETWEEN 20 AND 3000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_cleanliness_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_cleanliness_rating_check
      CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_accuracy_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_accuracy_rating_check
      CHECK (accuracy_rating IS NULL OR accuracy_rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_checkin_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_checkin_rating_check
      CHECK (checkin_rating IS NULL OR checkin_rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_value_rating_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_value_rating_check
      CHECK (value_rating IS NULL OR value_rating BETWEEN 1 AND 5);
  END IF;
END $$;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'sub') = guest_id::text
  OR (auth.jwt() ->> 'sub') = auth_subject
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Guests can post reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Guests can review completed stays" ON public.reviews;
CREATE POLICY "Public can read published reviews"
ON public.reviews FOR SELECT TO anon, authenticated
USING (is_published = true);

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
  AND cleanliness_rating BETWEEN 1 AND 5
  AND accuracy_rating BETWEEN 1 AND 5
  AND checkin_rating BETWEEN 1 AND 5
  AND value_rating BETWEEN 1 AND 5
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

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  voter_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (review_id, voter_subject)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guests can read own helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Guests can vote helpful once" ON public.review_helpful_votes;
CREATE POLICY "Guests can read own helpful votes"
ON public.review_helpful_votes FOR SELECT TO authenticated
USING (voter_subject = (auth.jwt() ->> 'sub'));
CREATE POLICY "Guests can vote helpful once"
ON public.review_helpful_votes FOR INSERT TO authenticated
WITH CHECK (
  voter_subject = (auth.jwt() ->> 'sub')
  AND EXISTS (
    SELECT 1
    FROM public.reviews AS review
    WHERE review.id = review_helpful_votes.review_id
      AND review.is_published = true
      AND review.guest_subject IS DISTINCT FROM voter_subject
      AND (review.guest_id IS NULL OR review.guest_id::text <> voter_subject)
  )
);

CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;

  UPDATE public.reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.review_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS update_review_helpful_count_after_vote ON public.review_helpful_votes;
CREATE TRIGGER update_review_helpful_count_after_vote
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

CREATE OR REPLACE FUNCTION public.get_review_summary(target_property_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  one_star BIGINT,
  two_star BIGINT,
  three_star BIGINT,
  four_star BIGINT,
  five_star BIGINT
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
    COUNT(*) FILTER (WHERE ROUND(rating) = 5)::BIGINT
  FROM public.reviews
  WHERE property_id = target_property_id
    AND is_published = true
    AND is_sample = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_summary(UUID) TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.review_helpful_votes TO authenticated;
