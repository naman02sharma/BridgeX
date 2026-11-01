-- ==============================================================================
-- BridgeX Complete Database Migration & Setup (Safe & Idempotent)
-- This script safely runs whether your tables already exist or not.
-- Run in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ogtyduxdbboeeqnweemp/sql/new
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create public.profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  name TEXT,
  phone TEXT,
  organization TEXT,
  verified BOOLEAN DEFAULT FALSE,
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns exist on public.profiles (for existing tables)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Drop old restrictive constraint and allow all role types
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'victim', 'responder', 'hospital', 'fire', 'police', 'volunteer', 'ngo', 'admin'));

-- 3. Create public.responders table
CREATE TABLE IF NOT EXISTS public.responders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization TEXT,
  verification_status TEXT DEFAULT 'verified',
  specializations TEXT[] DEFAULT '{}',
  response_radius INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure unique constraint on responders(user_id) for upserts
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

-- 4. Create public.responder_locations table
CREATE TABLE IF NOT EXISTS public.responder_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  responder_id UUID REFERENCES public.responders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT DEFAULT 'available',
  accuracy DECIMAL(6, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(responder_id)
);

-- 5. Create public.alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  responder_phone TEXT,
  emergency_type TEXT,
  urgency_level TEXT DEFAULT 'high',
  message TEXT,
  original_message TEXT,
  language_code TEXT DEFAULT 'en',
  location JSONB,
  status TEXT DEFAULT 'active',
  panic_mode BOOLEAN DEFAULT FALSE,
  panic_timer INTEGER,
  responders UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure accepted_by and responder_phone exist on alerts
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS responder_phone TEXT;

-- 6. Create public.chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_type TEXT DEFAULT 'user',
  content TEXT NOT NULL,
  translated_content JSONB,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 9. Setup RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Setup RLS Policies for Responders
DROP POLICY IF EXISTS "Anyone can view responders" ON public.responders;
CREATE POLICY "Anyone can view responders" ON public.responders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Responders can insert their own responder profile" ON public.responders;
CREATE POLICY "Responders can insert their own responder profile" ON public.responders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Responders can update their own profile" ON public.responders;
CREATE POLICY "Responders can update their own profile" ON public.responders
  FOR UPDATE USING (auth.uid() = user_id);

-- Setup RLS Policies for Alerts
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.alerts;
CREATE POLICY "Anyone can create alerts" ON public.alerts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view active alerts" ON public.alerts;
CREATE POLICY "Authenticated users can view active alerts" ON public.alerts
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND status IN ('active', 'responding'))
    OR user_id = auth.uid()
    OR accepted_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update alerts" ON public.alerts;
CREATE POLICY "Users can update alerts" ON public.alerts
  FOR UPDATE USING (
    user_id = auth.uid()
    OR accepted_by = auth.uid()
    OR (accepted_by IS NULL AND auth.uid() IS NOT NULL)
  );

-- 10. Fault-tolerant Trigger Function for Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_org TEXT;
BEGIN
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'responderRole',
    'user'
  );
  v_name := NEW.raw_user_meta_data->>'name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_org := NEW.raw_user_meta_data->>'organization';

  -- Normalize role to valid enum
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
  -- Exception safety: Log warning and NEVER throw, preventing "Database error saving new user"
  RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
