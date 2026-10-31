-- ============================================================
-- QAFNEST SUPABASE DATABASE SCHEMA & RLS POLICIES (PRODUCTION SAFE)
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

-- 2. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. User Profiles Table (Synced with auth.users)
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

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (
  auth.uid() = id AND role <> 'admin'::user_role AND host_status <> 'verified'::host_status
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for profiles" ON public.profiles;
CREATE POLICY "Allow insert for profiles" 
ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id AND role <> 'admin'::user_role AND host_status <> 'verified'::host_status
);

-- 4. Robust Automatic Profile Creation Trigger on Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  assigned_role user_role := 'guest'::user_role;
  assigned_host_status host_status := 'none'::host_status;
  meta_role text;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  
  IF meta_role = 'host' THEN
    assigned_role := 'host'::user_role;
    assigned_host_status := 'pending'::host_status;
  ELSE
    assigned_role := 'guest'::user_role;
    assigned_host_status := 'none'::host_status;
  END IF;

  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone, 
    role, 
    host_status, 
    tourism_license_no
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    assigned_role,
    assigned_host_status,
    NEW.raw_user_meta_data->>'tourism_license_no'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    tourism_license_no = EXCLUDED.tourism_license_no;

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

-- 5. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  city_name TEXT,
  district TEXT,
  category_name TEXT,
  specs TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  discount_percentage NUMERIC(5, 2),
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  capacity INT,
  bedrooms_count INT,
  living_rooms_count INT,
  area_sqm NUMERIC(10, 2),
  weekday_price NUMERIC(10, 2),
  weekend_price NUMERIC(10, 2),
  checkin_time TIME DEFAULT '15:00',
  checkout_time TIME DEFAULT '12:00',
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  is_licensed BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  instant_book BOOLEAN DEFAULT true,
  has_pool BOOLEAN DEFAULT false,
  self_checkin BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS capacity INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms_count INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS living_rooms_count INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekday_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekend_price NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '15:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT false;
ALTER TABLE public.properties ALTER COLUMN is_approved SET DEFAULT false;
ALTER TABLE public.properties DROP COLUMN IF EXISTS tourism_license_no;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
CREATE POLICY "Anyone can view approved properties" 
ON public.properties FOR SELECT USING (is_approved = true OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can insert properties" ON public.properties;
CREATE POLICY "Hosts can insert properties" 
ON public.properties FOR INSERT WITH CHECK (auth.uid() = host_id AND is_approved = false AND is_licensed = false);

DROP POLICY IF EXISTS "Hosts can update own properties" ON public.properties;
CREATE POLICY "Hosts can update own properties" 
ON public.properties FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (
  auth.uid() = host_id AND is_approved = false AND is_licensed = false
);

DROP POLICY IF EXISTS "Hosts can delete own properties" ON public.properties;
CREATE POLICY "Hosts can delete own properties" 
ON public.properties FOR DELETE USING (auth.uid() = host_id);

CREATE TABLE IF NOT EXISTS public.property_availability (
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  nightly_price NUMERIC(10, 2),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (property_id, date)
);

ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.property_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_availability TO authenticated;
DROP POLICY IF EXISTS "Anyone can view property availability" ON public.property_availability;
CREATE POLICY "Anyone can view property availability" ON public.property_availability
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.properties p
  WHERE p.id = property_id AND (p.is_approved = true OR p.host_id = auth.uid())
));
DROP POLICY IF EXISTS "Hosts can manage availability for own properties" ON public.property_availability;
CREATE POLICY "Hosts can manage availability for own properties" ON public.property_availability
FOR ALL TO authenticated USING (EXISTS (
  SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid()
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid()
));

-- Keep submitted license numbers private; only the owner may read their own submission.
CREATE TABLE IF NOT EXISTS public.host_license_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  license_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.host_license_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.host_license_submissions TO authenticated;
DROP POLICY IF EXISTS "Hosts can view own license submissions" ON public.host_license_submissions;
CREATE POLICY "Hosts can view own license submissions" ON public.host_license_submissions
FOR SELECT TO authenticated USING (auth.uid() = host_id);
DROP POLICY IF EXISTS "Hosts can submit own property license" ON public.host_license_submissions;
CREATE POLICY "Hosts can submit own property license" ON public.host_license_submissions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id AND EXISTS (
  SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid()
));

-- Public property photos; uploads are restricted to a folder named after the owner UUID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('qafnest-properties', 'qafnest-properties', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
CREATE POLICY "Public can view property photos" ON storage.objects
FOR SELECT USING (bucket_id = 'qafnest-properties');

DROP POLICY IF EXISTS "Hosts can upload own property photos" ON storage.objects;
CREATE POLICY "Hosts can upload own property photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'qafnest-properties' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Hosts can update own property photos" ON storage.objects;
CREATE POLICY "Hosts can update own property photos" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'qafnest-properties' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Hosts can delete own property photos" ON storage.objects;
CREATE POLICY "Hosts can delete own property photos" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'qafnest-properties' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Bookings Table
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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings or bookings of their properties" ON public.bookings;
CREATE POLICY "Users can view own bookings or bookings of their properties" 
ON public.bookings FOR SELECT USING (
  auth.uid() = guest_id OR 
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND host_id = auth.uid())
);

DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
CREATE POLICY "Guests can create bookings" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
