-- Complete Policy Cleanup for BridgeX
-- Run this FIRST in Supabase SQL Editor to clean up existing policies
-- Drop ALL existing policies on all tables
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
-- Also drop any other policies that might exist
DO $$
DECLARE pol record;
BEGIN FOR pol IN
SELECT schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'alerts',
    'responders',
    'responder_locations',
    'notifications',
    'chat_messages'
  ) LOOP EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %I.%I',
    pol.policyname,
    pol.schemaname,
    pol.tablename
  );
END LOOP;
END $$;