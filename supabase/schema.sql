-- ============================================================
-- QAFNEST SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ============================================================

-- 1. Create custom ENUM types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('guest', 'host', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE host_status AS ENUM ('none', 'pending', 'verified', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- 2. User Profiles Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'guest'::user_role NOT NULL,
  host_status host_status DEFAULT 'none'::host_status NOT NULL,
  tourism_license_no TEXT,
  national_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Automatic Profile Creation Trigger on Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, host_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'guest'::user_role),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'host' THEN 'pending'::host_status
      ELSE 'none'::host_status
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'chalet', 'villa', 'farm', 'camp', 'penthouse'
  city TEXT NOT NULL,     -- 'riyadh', 'jeddah', 'alula', 'khobar', 'abha'
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
  is_approved BOOLEAN DEFAULT true, -- default true for ease during dev
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved properties" 
ON public.properties FOR SELECT USING (is_approved = true OR auth.uid() = host_id);

CREATE POLICY "Hosts can insert properties" 
ON public.properties FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own properties" 
ON public.properties FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own properties" 
ON public.properties FOR DELETE USING (auth.uid() = host_id);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings or bookings of their properties" 
ON public.bookings FOR SELECT USING (
  auth.uid() = guest_id OR 
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND host_id = auth.uid())
);

CREATE POLICY "Guests can create bookings" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts or Guests can update booking status" 
ON public.bookings FOR UPDATE USING (
  auth.uid() = guest_id OR 
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND host_id = auth.uid())
);
