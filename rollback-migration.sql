-- BridgeX Database Migration Rollback
-- Run this in Supabase SQL Editor if you need to undo add-missing-tables.sql
-- WARNING: This will delete the push_subscriptions table and remove columns
DO $$ BEGIN RAISE NOTICE 'Starting migration rollback...';
-- ============================================
-- 1. DROP push_subscriptions TABLE
-- ============================================
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
RAISE NOTICE '✅ Dropped push_subscriptions table';
-- ============================================
-- 2. REMOVE COLUMNS FROM chat_messages
-- ============================================
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'chat_messages'
    AND column_name = 'sender_type'
) THEN
ALTER TABLE public.chat_messages DROP COLUMN sender_type;
RAISE NOTICE '✅ Removed sender_type column from chat_messages';
END IF;
-- ============================================
-- 3. REMOVE COLUMNS FROM notifications
-- ============================================
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'type'
) THEN
ALTER TABLE public.notifications DROP COLUMN type;
RAISE NOTICE '✅ Removed type column from notifications';
END IF;
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'priority'
) THEN
ALTER TABLE public.notifications DROP COLUMN priority;
RAISE NOTICE '✅ Removed priority column from notifications';
END IF;
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'message'
) THEN
ALTER TABLE public.notifications DROP COLUMN message;
RAISE NOTICE '✅ Removed message column from notifications';
END IF;
-- ============================================
-- 4. DROP TRIGGER FUNCTION
-- ============================================
DROP FUNCTION IF EXISTS handle_push_subscription_updated_at() CASCADE;
RAISE NOTICE '✅ Dropped trigger function';
RAISE NOTICE '🎉 Rollback completed successfully!';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE '❌ Rollback failed: %',
SQLERRM;
RAISE EXCEPTION 'Rollback aborted due to error: %',
SQLERRM;
END $$;