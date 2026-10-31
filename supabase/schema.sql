-- ============================================================
-- QAFNEST GUEST PLATFORM SUPABASE SCHEMA (qafnest.vercel.app)
-- ============================================================
-- Note: Host management and listings are managed on the separate
-- Host Platform (business.qafnest.vercel.app).
-- This database stores guest accounts, guest bookings, reviews,
-- favorites, and synchronized read-only property listings.
-- ============================================================

-- 1. Custom ENUM types for Guest Platform
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('initiated', 'success', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Guest Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  national_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert for profiles" ON public.profiles;
CREATE POLICY "Allow insert for profiles" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Automatic Profile Creation Trigger on Guest Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    national_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    NEW.raw_user_meta_data->>'national_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    national_id = EXCLUDED.national_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Properties Catalog (Read-Only for Guests; Synced from Host Platform)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_host_id TEXT, -- Reference to host on business.qafnest.vercel.app
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  city_name TEXT,
  category_name TEXT,
  specs TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  instant_book BOOLEAN DEFAULT true,
  has_pool BOOLEAN DEFAULT false,
  self_checkin BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
CREATE POLICY "Anyone can view approved properties" 
ON public.properties FOR SELECT USING (is_approved = true);

-- Note: Properties are inserted/updated via service_role API sync from Host Platform

-- 6. Guest Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_reference TEXT UNIQUE DEFAULT ('QAF-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_nights INT NOT NULL DEFAULT 1,
  guests_count INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status booking_status DEFAULT 'pending'::booking_status NOT NULL,
  payment_status payment_status DEFAULT 'initiated'::payment_status NOT NULL,
  smart_lock_pin TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings" 
ON public.bookings FOR SELECT USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
CREATE POLICY "Guests can create bookings" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);

-- 7. Guest Wishlists / Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(guest_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can manage own favorites" ON public.favorites;
CREATE POLICY "Guests can manage own favorites"
ON public.favorites FOR ALL USING (auth.uid() = guest_id);

-- 8. Guest Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews"
ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guests can post reviews" ON public.reviews;
CREATE POLICY "Guests can post reviews"
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = guest_id);
