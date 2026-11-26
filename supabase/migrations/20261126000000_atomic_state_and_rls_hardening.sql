-- Migration: 20261126000000_atomic_state_and_rls_hardening.sql
-- Adds:
-- 1. Profile KYC server-only lock trigger
-- 2. Property soft-delete/archive support & moderation guard fix
-- 3. Host RLS policies for property_availability & bookings state transitions
-- 4. Booking overlap check aligned with 'checked_in' and manual host blocks
-- 5. Normalized wallet, transaction, bank account, and payout tables with RLS
-- 6. Atomic Postgres RPCs for wallet topups, deductions, refunds, loyalty, and host payouts

-- ============================================================================
-- 1. KYC Field Tamper Guard (blocks client-side self-verification)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_profile_kyc_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := false;
      NEW.nafath_verified_at := NULL;
      NEW.verification_reference := NULL;
    ELSE
      NEW.is_verified := OLD.is_verified;
      NEW.nafath_verified_at := OLD.nafath_verified_at;
      NEW.verification_reference := OLD.verification_reference;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_kyc_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_kyc_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_kyc_fields();

-- ============================================================================
-- 2. Properties Archive / Soft-Delete Support & Guard Alignment
-- ============================================================================
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.properties'::regclass
      AND conname = 'properties_status_check'
  ) THEN
    ALTER TABLE public.properties DROP CONSTRAINT properties_status_check;
  END IF;
  ALTER TABLE public.properties
    ADD CONSTRAINT properties_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'archived'));
EXCEPTION WHEN others THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.guard_property_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
      RAISE EXCEPTION 'host_id cannot be reassigned by client updates';
    END IF;
    NEW.is_approved := false;
    IF NEW.status = 'archived' THEN
      NEW.status := 'archived';
      NEW.archived_at := COALESCE(NEW.archived_at, timezone('utc'::text, now()));
    ELSIF OLD.status = 'approved' THEN
      NEW.status := 'pending';
    END IF;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.rating := OLD.rating;
    NEW.reviews_count := OLD.reviews_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
CREATE POLICY "Hosts can update their own properties"
ON public.properties FOR UPDATE TO authenticated
USING (host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'))
WITH CHECK (
  host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  AND is_approved = false
  AND status IN ('pending', 'rejected', 'archived')
);

-- ============================================================================
-- 3. Host RLS Policies for Availability & Bookings
-- ============================================================================
DROP POLICY IF EXISTS "Hosts can manage own property availability" ON public.property_availability;
CREATE POLICY "Hosts can manage own property availability"
ON public.property_availability FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_availability.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_availability.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
);

CREATE OR REPLACE FUNCTION public.guard_booking_client_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = OLD.property_id
        AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
    ) THEN
      -- Hosts may only transition stay status (check-in / complete / cancel)
      NEW.property_id := OLD.property_id;
      NEW.guest_id := OLD.guest_id;
      NEW.total_price := OLD.total_price;
      NEW.payment_status := OLD.payment_status;
      NEW.payment_method := OLD.payment_method;
      NEW.payment_id := OLD.payment_id;
      NEW.smart_lock_pin := OLD.smart_lock_pin;
    ELSE
      -- Guests cannot tamper pricing or payment settlement flags directly
      NEW.property_id := OLD.property_id;
      NEW.guest_id := OLD.guest_id;
      NEW.total_price := OLD.total_price;
      NEW.payment_status := OLD.payment_status;
      NEW.payment_method := OLD.payment_method;
      NEW.payment_id := OLD.payment_id;
      NEW.smart_lock_pin := OLD.smart_lock_pin;
      IF NEW.status NOT IN ('cancelled', 'refund_requested') THEN
        NEW.status := OLD.status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_booking_client_updates ON public.bookings;
CREATE TRIGGER trg_guard_booking_client_updates
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_booking_client_updates();

DROP POLICY IF EXISTS "Hosts can update booking status for own properties" ON public.bookings;
CREATE POLICY "Hosts can update booking status for own properties"
ON public.bookings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = bookings.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = bookings.property_id
      AND p.host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub')
  )
);

-- ============================================================================
-- 4. Booking Overlap & Manual Availability Lock Alignment
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_overlapping_active_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_active BOOLEAN;
  v_new_start TIMESTAMP;
  v_new_end TIMESTAMP;
  v_conflict_ref TEXT;
  v_blocked_date DATE;
BEGIN
  IF NEW.status IN ('cancelled', 'rejected', 'refunded') THEN
    RETURN NEW;
  END IF;

  v_new_active := (
    NEW.status IN ('confirmed', 'checked_in', 'completed')
    OR (
      NEW.status = 'pending'
      AND COALESCE(NEW.created_at, timezone('utc'::text, now())) > (timezone('utc'::text, now()) - INTERVAL '15 minutes')
    )
  );

  IF NOT v_new_active THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.property_id::text));

  v_new_start := NEW.check_in::timestamp + COALESCE(NEW.checkin_time, '16:00'::time);
  v_new_end := NEW.check_out::timestamp + COALESCE(NEW.checkout_time, '12:00'::time);

  IF v_new_end <= v_new_start THEN
    RAISE EXCEPTION 'invalid_booking_time_window: checkout timestamp must be after checkin timestamp';
  END IF;

  -- Reject new/updated bookings against manually blocked property_availability dates
  IF TG_OP = 'INSERT' AND NEW.check_out > NEW.check_in THEN
    SELECT pa.date INTO v_blocked_date
    FROM public.property_availability pa
    WHERE pa.property_id = NEW.property_id
      AND pa.is_available = false
      AND pa.date >= NEW.check_in::date
      AND pa.date < NEW.check_out::date
    LIMIT 1;
    IF v_blocked_date IS NOT NULL THEN
      RAISE EXCEPTION 'property_date_blocked: date % is marked unavailable', v_blocked_date;
    END IF;
  END IF;

  SELECT b.booking_reference INTO v_conflict_ref
  FROM public.bookings b
  WHERE b.property_id = NEW.property_id
    AND (NEW.id IS NULL OR b.id <> NEW.id)
    AND (
      b.status IN ('confirmed', 'checked_in', 'completed')
      OR (
        b.status = 'pending'
        AND b.created_at > (timezone('utc'::text, now()) - INTERVAL '15 minutes')
      )
    )
    AND (b.check_in::timestamp + COALESCE(b.checkin_time, '16:00'::time)) < v_new_end
    AND (b.check_out::timestamp + COALESCE(b.checkout_time, '12:00'::time)) > v_new_start
  LIMIT 1;

  IF v_conflict_ref IS NOT NULL THEN
    RAISE EXCEPTION 'booking_slot_overlap: conflicts with active booking %', v_conflict_ref;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_verified_booking(
  p_booking_ref TEXT,
  p_payment_id TEXT,
  p_gateway TEXT,
  p_amount NUMERIC,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_start TIMESTAMP;
  v_end TIMESTAMP;
  v_conflict_ref TEXT;
  v_blocked_date DATE;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE booking_reference = p_booking_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  IF v_booking.payment_id = p_payment_id
     AND v_booking.status IN ('confirmed'::booking_status, 'checked_in'::booking_status, 'completed'::booking_status)
     AND v_booking.payment_status = 'success'::payment_status THEN
    RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'booking_reference', p_booking_ref);
  END IF;

  IF v_booking.payment_id IS NOT NULL AND v_booking.payment_id <> p_payment_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_already_paid');
  END IF;

  IF ABS(v_booking.total_price - p_amount) > 0.01 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_mismatch');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_booking.property_id::text));

  v_start := v_booking.check_in::timestamp + COALESCE(v_booking.checkin_time, '16:00'::time);
  v_end := v_booking.check_out::timestamp + COALESCE(v_booking.checkout_time, '12:00'::time);

  SELECT b.booking_reference INTO v_conflict_ref
  FROM public.bookings b
  WHERE b.property_id = v_booking.property_id
    AND b.id <> v_booking.id
    AND b.status IN ('confirmed', 'checked_in', 'completed')
    AND (b.check_in::timestamp + COALESCE(b.checkin_time, '16:00'::time)) < v_end
    AND (b.check_out::timestamp + COALESCE(b.checkout_time, '12:00'::time)) > v_start
  LIMIT 1;

  IF v_conflict_ref IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_slot_overlap', 'conflict_reference', v_conflict_ref);
  END IF;

  IF v_booking.check_out > v_booking.check_in THEN
    SELECT pa.date INTO v_blocked_date
    FROM public.property_availability pa
    WHERE pa.property_id = v_booking.property_id
      AND pa.is_available = false
      AND pa.date >= v_booking.check_in::date
      AND pa.date < v_booking.check_out::date
    LIMIT 1;

    IF v_blocked_date IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'property_date_blocked', 'blocked_date', v_blocked_date);
    END IF;
  END IF;

  UPDATE public.bookings
  SET status = 'confirmed'::booking_status,
      payment_status = 'success'::payment_status,
      payment_method = p_gateway,
      payment_id = p_payment_id,
      smart_lock_pin = p_pin,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_booking.id;

  IF v_booking.check_out > v_booking.check_in THEN
    INSERT INTO public.property_availability (property_id, date, is_available)
    SELECT v_booking.property_id, d::date, false
    FROM generate_series(v_booking.check_in, v_booking.check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
    ON CONFLICT (property_id, date) DO UPDATE
      SET is_available = false, updated_at = timezone('utc'::text, now());
  END IF;

  RETURN jsonb_build_object('success', true, 'booking_reference', p_booking_ref);
END;
$$;

-- ============================================================================
-- 5. Authoritative Wallets, Transactions, Bank Accounts, and Payouts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id TEXT PRIMARY KEY,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  loyalty_tier TEXT NOT NULL DEFAULT 'Bronze',
  welcome_bonus_credited BOOLEAN NOT NULL DEFAULT false,
  welcome_bonus_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (welcome_bonus_balance >= 0),
  welcome_bonus_total_awarded NUMERIC(12,2) NOT NULL DEFAULT 0,
  welcome_bonus_awarded_at TIMESTAMPTZ,
  welcome_bonus_device_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallets FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallets FROM authenticated;
DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
CREATE POLICY "Users can read own wallet"
ON public.wallets FOR SELECT TO authenticated
USING (user_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.wallets(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  points INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  reference TEXT NOT NULL,
  payment_id TEXT,
  payment_method TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tx_user_type_ref
  ON public.wallet_transactions(user_id, type, reference);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tx_payment_id
  ON public.wallet_transactions(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created
  ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_transactions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallet_transactions FROM authenticated;
DROP POLICY IF EXISTS "Users can read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can read own wallet transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (user_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'));

CREATE TABLE IF NOT EXISTS public.host_bank_accounts (
  host_id TEXT PRIMARY KEY,
  bank_name TEXT,
  bank_code TEXT,
  account_holder TEXT,
  iban_last4 TEXT,
  iban_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification',
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.host_bank_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.host_bank_accounts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.host_bank_accounts FROM authenticated;
DROP POLICY IF EXISTS "Hosts can view own bank account" ON public.host_bank_accounts;
CREATE POLICY "Hosts can view own bank account"
ON public.host_bank_accounts FOR SELECT TO authenticated
USING (host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'));

CREATE TABLE IF NOT EXISTS public.host_payouts (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  host_name TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending_approval',
  bank_name TEXT NOT NULL,
  iban_masked TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  legal_transaction_number TEXT,
  booking_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_host_payouts_host_status
  ON public.host_payouts(host_id, status);

ALTER TABLE public.host_payouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.host_payouts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.host_payouts FROM authenticated;
DROP POLICY IF EXISTS "Hosts can view own payouts" ON public.host_payouts;
CREATE POLICY "Hosts can view own payouts"
ON public.host_payouts FOR SELECT TO authenticated
USING (host_id = COALESCE(auth.uid()::text, auth.jwt() ->> 'sub'));

-- ============================================================================
-- 6. Atomic Wallet, Loyalty, and Host Payout RPCs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.compute_loyalty_tier(p_points INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_points, 0) >= 5000 THEN 'Platinum'
    WHEN COALESCE(p_points, 0) >= 2000 THEN 'Gold'
    WHEN COALESCE(p_points, 0) >= 500 THEN 'Silver'
    ELSE 'Bronze'
  END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet_topup_atomic(
  p_user_id TEXT,
  p_payment_id TEXT,
  p_reference TEXT,
  p_amount NUMERIC,
  p_bonus_points INTEGER,
  p_payment_method TEXT,
  p_title_en TEXT,
  p_title_ar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_clean_amount NUMERIC(12,2);
  v_clean_points INTEGER;
  v_new_balance NUMERIC(12,2);
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  v_clean_amount := ROUND(COALESCE(p_amount, 0)::numeric, 2);
  v_clean_points := GREATEST(0, COALESCE(p_bonus_points, 0));

  IF v_clean_amount <= 0 OR COALESCE(p_payment_id, '') = '' OR COALESCE(p_reference, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_topup_parameters');
  END IF;

  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE payment_id = p_payment_id
       OR (user_id = p_user_id AND type = 'topup' AND reference = p_reference)
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'balance', v_wallet.balance,
      'loyalty_points', v_wallet.loyalty_points,
      'loyalty_tier', v_wallet.loyalty_tier
    );
  END IF;

  v_new_balance := ROUND((v_wallet.balance + v_clean_amount)::numeric, 2);
  v_new_points := v_wallet.loyalty_points + v_clean_points;
  v_new_tier := public.compute_loyalty_tier(v_new_points);

  UPDATE public.wallets
  SET balance = v_new_balance,
      loyalty_points = v_new_points,
      loyalty_tier = v_new_tier,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (
    id, user_id, type, amount, points, status, reference, payment_id, payment_method, title_en, title_ar
  ) VALUES (
    format('tx-topup-%s-%s', extract(epoch from now())::bigint, substr(md5(p_payment_id), 1, 6)),
    p_user_id,
    'topup',
    v_clean_amount,
    NULLIF(v_clean_points, 0),
    'completed',
    p_reference,
    p_payment_id,
    COALESCE(NULLIF(p_payment_method, ''), 'card'),
    p_title_en,
    p_title_ar
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'balance', v_new_balance,
    'loyalty_points', v_new_points,
    'loyalty_tier', v_new_tier
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_or_deduct_wallet_atomic(
  p_user_id TEXT,
  p_amount NUMERIC,
  p_reference TEXT,
  p_title_en TEXT,
  p_title_ar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_clean_amount NUMERIC(12,2);
  v_avail_welcome NUMERIC(12,2);
  v_welcome_used NUMERIC(12,2);
  v_new_balance NUMERIC(12,2);
  v_rem_welcome NUMERIC(12,2);
BEGIN
  v_clean_amount := ROUND(COALESCE(p_amount, 0)::numeric, 2);
  IF v_clean_amount <= 0 OR COALESCE(p_reference, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_deduction_parameters');
  END IF;

  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = p_user_id AND type = 'booking_payment' AND reference = p_reference
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_deducted', true,
      'new_balance', v_wallet.balance,
      'welcome_bonus_used', 0
    );
  END IF;

  IF v_wallet.balance < v_clean_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'new_balance', v_wallet.balance
    );
  END IF;

  v_avail_welcome := GREATEST(0, LEAST(v_wallet.balance, COALESCE(v_wallet.welcome_bonus_balance, 0)));
  v_welcome_used := ROUND(LEAST(v_avail_welcome, v_clean_amount)::numeric, 2);
  v_rem_welcome := ROUND(GREATEST(0, v_avail_welcome - v_welcome_used)::numeric, 2);
  v_new_balance := ROUND((v_wallet.balance - v_clean_amount)::numeric, 2);

  UPDATE public.wallets
  SET balance = v_new_balance,
      welcome_bonus_balance = v_rem_welcome,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (
    id, user_id, type, amount, status, reference, payment_method, title_en, title_ar
  ) VALUES (
    format('tx-book-%s-%s', extract(epoch from now())::bigint, substr(md5(p_reference), 1, 6)),
    p_user_id,
    'booking_payment',
    -v_clean_amount,
    'completed',
    p_reference,
    'wallet',
    p_title_en,
    p_title_ar
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_deducted', false,
    'new_balance', v_new_balance,
    'welcome_bonus_used', v_welcome_used
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_wallet_atomic(
  p_user_id TEXT,
  p_amount NUMERIC,
  p_welcome_restore NUMERIC,
  p_reference TEXT,
  p_title_en TEXT,
  p_title_ar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_clean_amount NUMERIC(12,2);
  v_clean_welcome NUMERIC(12,2);
  v_new_balance NUMERIC(12,2);
BEGIN
  v_clean_amount := ROUND(GREATEST(0, COALESCE(p_amount, 0))::numeric, 2);
  v_clean_welcome := ROUND(GREATEST(0, COALESCE(p_welcome_restore, 0))::numeric, 2);

  IF v_clean_amount <= 0 OR COALESCE(p_reference, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_refund_parameters');
  END IF;

  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = p_user_id AND type = 'refund' AND reference = p_reference
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_refunded', true,
      'balance', v_wallet.balance
    );
  END IF;

  v_new_balance := ROUND((v_wallet.balance + v_clean_amount)::numeric, 2);

  UPDATE public.wallets
  SET balance = v_new_balance,
      welcome_bonus_balance = ROUND((COALESCE(v_wallet.welcome_bonus_balance, 0) + v_clean_welcome)::numeric, 2),
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (
    id, user_id, type, amount, status, reference, payment_method, title_en, title_ar
  ) VALUES (
    format('tx-refund-%s-%s', extract(epoch from now())::bigint, substr(md5(p_reference), 1, 6)),
    p_user_id,
    'refund',
    v_clean_amount,
    'completed',
    p_reference,
    'wallet',
    p_title_en,
    p_title_ar
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_refunded', false,
    'balance', v_new_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_loyalty_points_atomic(
  p_user_id TEXT,
  p_points INTEGER,
  p_reference TEXT,
  p_title_en TEXT,
  p_title_ar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_clean_points INTEGER;
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  v_clean_points := GREATEST(0, COALESCE(p_points, 0));
  IF v_clean_points <= 0 OR COALESCE(p_reference, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_points');
  END IF;

  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = p_user_id AND type = 'reward' AND reference = p_reference
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_awarded', true,
      'loyalty_points', v_wallet.loyalty_points,
      'loyalty_tier', v_wallet.loyalty_tier
    );
  END IF;

  v_new_points := v_wallet.loyalty_points + v_clean_points;
  v_new_tier := public.compute_loyalty_tier(v_new_points);

  UPDATE public.wallets
  SET loyalty_points = v_new_points,
      loyalty_tier = v_new_tier,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (
    id, user_id, type, amount, points, status, reference, payment_method, title_en, title_ar
  ) VALUES (
    format('tx-reward-%s-%s', extract(epoch from now())::bigint, substr(md5(p_reference), 1, 6)),
    p_user_id,
    'reward',
    0,
    v_clean_points,
    'completed',
    p_reference,
    'system',
    p_title_en,
    p_title_ar
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_awarded', false,
    'loyalty_points', v_new_points,
    'loyalty_tier', v_new_tier
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_host_payout_atomic(
  p_id TEXT,
  p_reference TEXT,
  p_host_id TEXT,
  p_host_name TEXT,
  p_amount NUMERIC,
  p_bank_name TEXT,
  p_iban_masked TEXT,
  p_account_holder TEXT,
  p_booking_refs JSONB,
  p_notes TEXT,
  p_settled_net_cap NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_amount NUMERIC(12,2);
  v_committed NUMERIC(12,2);
  v_available NUMERIC(12,2);
BEGIN
  v_clean_amount := ROUND(COALESCE(p_amount, 0)::numeric, 2);
  IF v_clean_amount <= 0 OR COALESCE(p_host_id, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_payout_parameters');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_host_id));

  SELECT COALESCE(SUM(amount), 0)::numeric(12,2) INTO v_committed
  FROM public.host_payouts
  WHERE host_id = p_host_id
    AND status NOT IN ('rejected', 'failed');

  v_available := ROUND(GREATEST(0, COALESCE(p_settled_net_cap, 0) - v_committed)::numeric, 2);

  IF v_clean_amount > v_available + 0.01 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_available_balance',
      'available_balance', v_available
    );
  END IF;

  INSERT INTO public.host_payouts (
    id, reference, host_id, host_name, amount, status, bank_name, iban_masked, account_holder, booking_refs, notes
  ) VALUES (
    p_id,
    p_reference,
    p_host_id,
    p_host_name,
    v_clean_amount,
    'pending_approval',
    p_bank_name,
    p_iban_masked,
    p_account_holder,
    COALESCE(p_booking_refs, '[]'::jsonb),
    p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_id,
    'reference', p_reference,
    'available_after', ROUND((v_available - v_clean_amount)::numeric, 2)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_topup_atomic(TEXT, TEXT, TEXT, NUMERIC, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet_topup_atomic(TEXT, TEXT, TEXT, NUMERIC, INTEGER, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.reserve_or_deduct_wallet_atomic(TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_or_deduct_wallet_atomic(TEXT, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.refund_wallet_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_wallet_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.award_loyalty_points_atomic(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points_atomic(TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.create_host_payout_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_host_payout_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB, TEXT, NUMERIC) TO service_role;
