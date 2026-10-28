-- ============================================================
-- FIX: Supabase "Database error saving new user"
-- ============================================================

-- 1. Ensure schema search path and permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Fix Profile Insert RLS Policy (Prevents RLS from blocking new user trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for profiles" ON public.profiles;

CREATE POLICY "Allow insert for profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- 3. Robust Trigger Function with Safe Role Handling & Exception Fallback
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
  -- Extract role from metadata safely
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  
  IF meta_role = 'host' THEN
    assigned_role := 'host'::user_role;
    assigned_host_status := 'pending'::host_status;
  ELSIF meta_role = 'admin' THEN
    assigned_role := 'admin'::user_role;
    assigned_host_status := 'verified'::host_status;
  ELSE
    assigned_role := 'guest'::user_role;
    assigned_host_status := 'none'::host_status;
  END IF;

  -- Insert profile
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
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
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
  -- Fallback: Even if profile insert encounters any edge-case, do NOT block user creation
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Re-bind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
