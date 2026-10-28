-- ============================================================
-- BridgeX: SOS -> nearby responders -> accept / cancel flow
-- Run ONCE in the Supabase SQL Editor, AFTER setup-database.sql
-- (safe to re-run: every statement is idempotent)
-- ============================================================

-- 1. alerts: allow every emergency type the app can send, track who accepted
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_emergency_type_check;
ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_emergency_type_check CHECK (
    emergency_type IN ('medical', 'fire', 'accident', 'security', 'natural_disaster', 'other')
  );

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- 2. notifications: one row per (alert, responder) with its own status
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_alert_id ON public.notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);

-- 3. responders: columns the app reads
ALTER TABLE public.responders ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.responders ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. Row Level Security: a user may read/insert their own responder row.
--    (All dispatch / accept / cancel logic runs in API routes with the
--    service-role key, so nobody can accept an alert by editing rows directly.)
DROP POLICY IF EXISTS "Users can register themselves as responder" ON public.responders;
CREATE POLICY "Users can register themselves as responder" ON public.responders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view verified responders" ON public.responders;
CREATE POLICY "Anyone can view verified responders" ON public.responders
  FOR SELECT USING (verification_status = 'verified');

-- 5. Realtime: responders get live inserts/updates on their notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
  END IF;
END $$;
