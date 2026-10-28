-- BridgeX Database Migration - Add Missing Tables and Columns
-- Run this in Supabase SQL Editor after setup-database.sql
-- This adds push_subscriptions table and fixes chat_messages schema
DO $$ BEGIN RAISE NOTICE 'Starting migration to add missing tables and columns...';
-- ============================================
-- 1. CREATE push_subscriptions TABLE
-- ============================================
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
-- Create push_subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  endpoint TEXT GENERATED ALWAYS AS (subscription->>'endpoint') STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, endpoint)
);
-- Create index for faster lookups
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
RAISE NOTICE '✅ push_subscriptions table created successfully';
-- ============================================
-- 2. FIX chat_messages TABLE
-- ============================================
-- Check if sender_type column exists, if not add it
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'chat_messages'
    AND column_name = 'sender_type'
) THEN
ALTER TABLE public.chat_messages
ADD COLUMN sender_type TEXT CHECK (sender_type IN ('user', 'responder', 'admin')) DEFAULT 'user';
RAISE NOTICE '✅ Added sender_type column to chat_messages';
ELSE RAISE NOTICE 'ℹ️  sender_type column already exists in chat_messages';
END IF;
-- Update existing rows to set sender_type based on sender_id
-- (Join with profiles to determine role)
UPDATE public.chat_messages cm
SET sender_type = COALESCE(
    (
      SELECT role
      FROM public.profiles
      WHERE id = cm.sender_id
    ),
    'user'
  )
WHERE sender_type IS NULL;
RAISE NOTICE '✅ Updated sender_type for existing chat_messages';
-- ============================================
-- 3. ADD MISSING COLUMNS TO notifications TABLE
-- ============================================
-- Add type column if it doesn't exist (used by push API)
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'type'
) THEN
ALTER TABLE public.notifications
ADD COLUMN type TEXT CHECK (
    type IN ('info', 'warning', 'error', 'success', 'alert')
  ) DEFAULT 'info';
RAISE NOTICE '✅ Added type column to notifications';
ELSE RAISE NOTICE 'ℹ️  type column already exists in notifications';
END IF;
-- Add priority column if it doesn't exist (used by push API)
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'priority'
) THEN
ALTER TABLE public.notifications
ADD COLUMN priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal';
RAISE NOTICE '✅ Added priority column to notifications';
ELSE RAISE NOTICE 'ℹ️  priority column already exists in notifications';
END IF;
-- Add message column if it doesn't exist (alias for body)
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'message'
) THEN
ALTER TABLE public.notifications
ADD COLUMN message TEXT;
-- Copy body to message for existing rows
UPDATE public.notifications
SET message = body
WHERE message IS NULL;
RAISE NOTICE '✅ Added message column to notifications';
ELSE RAISE NOTICE 'ℹ️  message column already exists in notifications';
END IF;
-- ============================================
-- MIGRATION COMPLETE
-- ============================================
RAISE NOTICE '🎉 Migration completed successfully!';
RAISE NOTICE '';
RAISE NOTICE 'Summary of changes:';
RAISE NOTICE '- Created push_subscriptions table with RLS policies';
RAISE NOTICE '- Added sender_type column to chat_messages';
RAISE NOTICE '- Added type, priority, message columns to notifications';
RAISE NOTICE '- Created indexes for performance';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Verify tables: SELECT tablename FROM pg_tables WHERE schemaname = ''public'';';
RAISE NOTICE '2. Test push notifications API';
RAISE NOTICE '3. Test chat functionality';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ Migration failed: %',
SQLERRM;
RAISE EXCEPTION 'Migration aborted due to error: %',
SQLERRM;
END $$;
-- ============================================
-- 4. CREATE TRIGGERS FOR updated_at (Outside DO block)
-- ============================================
CREATE OR REPLACE FUNCTION handle_push_subscription_updated_at() RETURNS TRIGGER AS $func$ BEGIN NEW.updated_at = TIMEZONE('utc'::text, NOW());
RETURN NEW;
END;
$func$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_push_subscription_updated ON public.push_subscriptions;
CREATE TRIGGER on_push_subscription_updated BEFORE
UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION handle_push_subscription_updated_at();
-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT SELECT,
  INSERT,
  UPDATE,
  DELETE ON public.push_subscriptions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;