-- BridgeX Database Setup - Simple and Robust
-- Run this in Supabase SQL Editor
-- First, drop everything that might exist (ignore errors if they don't exist)
DO $$ BEGIN -- Drop policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view alerts they're involved in" ON public.alerts;
DROP POLICY IF EXISTS "Users can update alerts they're involved in" ON public.alerts;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view chat messages for alerts they're in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to alerts they're in" ON public.chat_messages;
DROP POLICY IF EXISTS "Responders can view their own responder profile" ON public.responders;
DROP POLICY IF EXISTS "Responders can update their own profile" ON public.responders;
DROP POLICY IF EXISTS "Responders can view their own location" ON public.responder_locations;
DROP POLICY IF EXISTS "Responders can update their own location" ON public.responder_locations;
DROP POLICY IF EXISTS "Users can view nearby responder locations" ON public.responder_locations;
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_alerts_updated_at ON public.alerts;
-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.responder_locations CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.responders CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
EXCEPTION
WHEN OTHERS THEN -- Ignore errors during cleanup
RAISE NOTICE 'Cleanup completed with some items not existing';
END $$;
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('user', 'responder', 'admin')) DEFAULT 'user',
  organization TEXT,
  verified BOOLEAN DEFAULT FALSE,
  languages TEXT [] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  emergency_type TEXT CHECK (
    emergency_type IN ('medical', 'fire', 'security', 'other')
  ),
  urgency_level TEXT CHECK (
    urgency_level IN ('low', 'medium', 'high', 'critical')
  ) DEFAULT 'high',
  message TEXT,
  original_message TEXT,
  language_code TEXT DEFAULT 'en',
  location JSONB,
  status TEXT CHECK (
    status IN ('active', 'responding', 'resolved', 'cancelled')
  ) DEFAULT 'active',
  panic_mode BOOLEAN DEFAULT FALSE,
  panic_timer INTEGER,
  responders UUID [] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  translated_content JSONB,
  message_type TEXT CHECK (
    message_type IN ('text', 'image', 'voice', 'file')
  ) DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  alert_id UUID REFERENCES public.alerts(id),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE TABLE public.responders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  organization TEXT,
  verification_status TEXT CHECK (
    verification_status IN ('pending', 'verified', 'rejected')
  ) DEFAULT 'pending',
  specializations TEXT [] DEFAULT '{}',
  response_radius INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE TABLE public.responder_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  responder_id UUID REFERENCES public.responders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT CHECK (
    status IN ('available', 'busy', 'responding', 'offline')
  ) DEFAULT 'available',
  accuracy DECIMAL(6, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(responder_id)
);
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responder_locations ENABLE ROW LEVEL SECURITY;
-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can create alerts" ON public.alerts FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can view alerts they're involved in" ON public.alerts FOR
SELECT USING (
    user_id = auth.uid()
    OR auth.uid() = ANY(responders)
  );
CREATE POLICY "Users can update alerts they're involved in" ON public.alerts FOR
UPDATE USING (
    user_id = auth.uid()
    OR auth.uid() = ANY(responders)
  );
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view chat messages for alerts they're in" ON public.chat_messages FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.alerts
      WHERE alerts.id = chat_messages.alert_id
        AND (
          alerts.user_id = auth.uid()
          OR auth.uid() = ANY(alerts.responders)
        )
    )
  );
CREATE POLICY "Users can send messages to alerts they're in" ON public.chat_messages FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.alerts
      WHERE alerts.id = chat_messages.alert_id
        AND (
          alerts.user_id = auth.uid()
          OR auth.uid() = ANY(alerts.responders)
        )
    )
  );
CREATE POLICY "Responders can view their own responder profile" ON public.responders FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Responders can update their own profile" ON public.responders FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Responders can view their own location" ON public.responder_locations FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.responders
      WHERE responders.id = responder_locations.responder_id
        AND responders.user_id = auth.uid()
    )
  );
CREATE POLICY "Responders can update their own location" ON public.responder_locations FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.responders
    WHERE responders.id = responder_locations.responder_id
      AND responders.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view nearby responder locations" ON public.responder_locations FOR
SELECT USING (active = true);
-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, role)
VALUES (NEW.id, NEW.email, 'user');
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = TIMEZONE('utc'::text, NOW());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create triggers
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER handle_alerts_updated_at BEFORE
UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();