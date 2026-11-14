-- Migration: Atomic Coupon Increment Function (SEC-07)
-- Prevents lost updates and race condition overconsumption on coupon usage limits.

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  UPDATE public.coupons
  SET used_count = coalesce(used_count, 0) + 1,
      updated_at = timezone('utc'::text, now())
  WHERE UPPER(code) = UPPER(p_code)
    AND (usage_limit IS NULL OR coalesce(used_count, 0) < usage_limit)
  RETURNING * INTO v_coupon;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = UPPER(p_code)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'usage_limit_reached');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'coupon_not_found');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'used_count', v_coupon.used_count);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_usage(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO authenticated, service_role;
