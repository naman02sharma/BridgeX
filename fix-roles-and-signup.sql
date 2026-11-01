-- ==============================================================================
-- BridgeX Database Migration: Fix Role Check Constraint & Safe User Signup
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ogtyduxdbboeeqnweemp/sql/new
-- ==============================================================================

-- 1. Ensure required columns exist on public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT;

-- 2. Drop the restrictive check constraint on profiles.role and allow all app roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'victim', 'responder', 'hospital', 'fire', 'police', 'volunteer', 'ngo', 'admin'));

-- 3. Ensure responders table has unique user_id constraint (for upserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'responders_user_id_key'
  ) THEN
    ALTER TABLE public.responders ADD CONSTRAINT responders_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'responders_user_id_key notice: %', SQLERRM;
END $$;

-- 4. Enable RLS and add policies for authenticated users to insert/update their profile & responder record
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Responders can insert their own responder profile" ON public.responders;
CREATE POLICY "Responders can insert their own responder profile" ON public.responders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Responders can update their own profile" ON public.responders;
CREATE POLICY "Responders can update their own profile" ON public.responders
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Update the handle_new_user() trigger function to be fully fault-tolerant
-- SECURITY DEFINER ensures it runs with administrative privileges to write to profiles & responders
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_org TEXT;
BEGIN
  -- Extract metadata safely
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'responderRole',
    'user'
  );
  v_name := NEW.raw_user_meta_data->>'name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_org := NEW.raw_user_meta_data->>'organization';

  -- Normalize role if not in allowed list
  IF v_role NOT IN ('user', 'victim', 'responder', 'hospital', 'fire', 'police', 'volunteer', 'ngo', 'admin') THEN
    v_role := 'user';
  END IF;

  -- Upsert profile record
  INSERT INTO public.profiles (id, email, role, name, phone, organization)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_name,
    v_phone,
    v_org
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    organization = COALESCE(EXCLUDED.organization, profiles.organization);

  -- If this is a responder account, also automatically create a verified responder entry
  IF v_role NOT IN ('user', 'victim') THEN
    INSERT INTO public.responders (
      user_id,
      organization,
      verification_status,
      active,
      response_radius,
      specializations
    )
    VALUES (
      NEW.id,
      COALESCE(v_org, v_name, 'Emergency Services'),
      'verified',
      TRUE,
      30,
      CASE 
        WHEN v_role = 'hospital' THEN ARRAY['medical', 'trauma', 'first-aid', 'hospital']
        WHEN v_role = 'fire' THEN ARRAY['fire', 'rescue', 'firefighter']
        WHEN v_role = 'police' THEN ARRAY['security', 'rescue', 'support', 'police']
        WHEN v_role = 'volunteer' THEN ARRAY['first-aid', 'support', 'rescue', 'medical']
        WHEN v_role = 'ngo' THEN ARRAY['support', 'rescue', 'medical']
        ELSE ARRAY['medical', 'rescue', 'first-aid']
      END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization = COALESCE(EXCLUDED.organization, responders.organization),
      active = TRUE;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Exception safety: Log warning and NEVER throw, so auth user creation never breaks with "Database error saving new user"
  RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
