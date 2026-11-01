-- Give explicitly allow-listed QafNest admins a safe way to publish review replies.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_by TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_admin_reply_length_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_admin_reply_length_check
      CHECK (admin_reply IS NULL OR char_length(admin_reply) BETWEEN 5 AND 2000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_admin_reply_metadata_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_admin_reply_metadata_check
      CHECK (
        (admin_reply IS NULL AND admin_reply_by IS NULL AND admin_reply_at IS NULL)
        OR (admin_reply IS NOT NULL AND admin_reply_by IS NOT NULL AND admin_reply_at IS NOT NULL)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.review_admins (
  auth_subject TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.review_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review admins can read their own access" ON public.review_admins;
CREATE POLICY "Review admins can read their own access"
ON public.review_admins FOR SELECT TO authenticated
USING (auth_subject = (auth.jwt() ->> 'sub'));

REVOKE ALL ON public.review_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.review_admins TO authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review admins can view all published reviews" ON public.reviews;
CREATE POLICY "Review admins can view all published reviews"
ON public.reviews FOR SELECT TO authenticated
USING (
  is_published = true
  AND is_sample = false
  AND EXISTS (
    SELECT 1
    FROM public.review_admins AS admin
    WHERE admin.auth_subject = (auth.jwt() ->> 'sub')
  )
);

DROP POLICY IF EXISTS "Review admins can reply to published reviews" ON public.reviews;
CREATE POLICY "Review admins can reply to published reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (
  is_published = true
  AND is_sample = false
  AND EXISTS (
    SELECT 1
    FROM public.review_admins AS admin
    WHERE admin.auth_subject = (auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  is_published = true
  AND is_sample = false
  AND EXISTS (
    SELECT 1
    FROM public.review_admins AS admin
    WHERE admin.auth_subject = (auth.jwt() ->> 'sub')
  )
);

REVOKE UPDATE ON public.reviews FROM PUBLIC, anon, authenticated;
GRANT UPDATE (admin_reply, admin_reply_by, admin_reply_at) ON public.reviews TO authenticated;
