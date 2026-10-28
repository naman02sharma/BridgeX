-- BridgeX Migration: Add accepted_by, responder_phone to alerts; add phone, name to profiles
-- Run this in your Supabase SQL Editor

-- 1. Add phone and name columns to profiles (if not already there)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add accepted_by and responder_phone to alerts
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS responder_phone TEXT;

-- 3. Update handle_new_user to also store name and phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS: allow any authenticated user to see active alerts (for responder view)
DROP POLICY IF EXISTS "Users can view alerts they're involved in" ON public.alerts;
CREATE POLICY "Authenticated users can view active alerts" ON public.alerts
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND status IN ('active', 'responding'))
    OR user_id = auth.uid()
    OR accepted_by = auth.uid()
  );

-- Allow responders to accept (update) unaccepted alerts
DROP POLICY IF EXISTS "Users can update alerts they're involved in" ON public.alerts;
CREATE POLICY "Users can update alerts" ON public.alerts
  FOR UPDATE USING (
    user_id = auth.uid()
    OR accepted_by = auth.uid()
    OR (accepted_by IS NULL AND auth.uid() IS NOT NULL)
  );

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_alerts_accepted_by ON public.alerts(accepted_by);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
