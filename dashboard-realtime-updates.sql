-- BridgeX Dashboard Real-time Features SQL
-- Run this in Supabase SQL Editor to enable all dashboard real-time features
-- ============================================
-- 1. NOTIFICATIONS TABLE ENHANCEMENTS
-- ============================================
-- Add missing columns to notifications table if they don't exist
DO $$ BEGIN -- Add type column for notification categorization
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'notifications'
    AND column_name = 'type'
) THEN
ALTER TABLE public.notifications
ADD COLUMN type TEXT CHECK (type IN ('alert', 'info', 'success', 'warning')) DEFAULT 'info';
END IF;
-- Add priority column
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'notifications'
    AND column_name = 'priority'
) THEN
ALTER TABLE public.notifications
ADD COLUMN priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal';
END IF;
-- Add message column (alias for body for backward compatibility)
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'notifications'
    AND column_name = 'message'
) THEN
ALTER TABLE public.notifications
ADD COLUMN message TEXT;
END IF;
END $$;
-- Update existing notifications to have proper types
UPDATE public.notifications
SET type = 'alert',
  priority = 'normal'
WHERE type IS NULL;
-- ============================================
-- 2. RESPONDER STATUS ENHANCEMENTS
-- ============================================
-- Add status and location tracking to responders table
DO $$ BEGIN -- Add status column
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'responders'
    AND column_name = 'status'
) THEN
ALTER TABLE public.responders
ADD COLUMN status TEXT CHECK (status IN ('on-duty', 'responding', 'off-duty')) DEFAULT 'off-duty';
END IF;
-- Add name column
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'responders'
    AND column_name = 'name'
) THEN
ALTER TABLE public.responders
ADD COLUMN name TEXT;
END IF;
-- Add type/team column
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'responders'
    AND column_name = 'type'
) THEN
ALTER TABLE public.responders
ADD COLUMN type TEXT CHECK (
    type IN ('medical', 'fire', 'police', 'rescue', 'general')
  ) DEFAULT 'general';
END IF;
-- Add current_location column
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'responders'
    AND column_name = 'current_location'
) THEN
ALTER TABLE public.responders
ADD COLUMN current_location TEXT;
END IF;
END $$;
-- ============================================
-- 3. ANALYTICS API TABLES
-- ============================================
-- Create analytics view for dashboard stats
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT COUNT(*) FILTER (
    WHERE created_at >= NOW() - INTERVAL '7 days'
  ) as total_alerts,
  COUNT(*) FILTER (
    WHERE status = 'active'
  ) as active_alerts,
  COUNT(*) FILTER (
    WHERE status = 'resolved'
      AND created_at >= NOW() - INTERVAL '7 days'
  ) as resolved_alerts,
  COUNT(*) FILTER (
    WHERE urgency_level IN ('high', 'critical')
      AND status = 'active'
  ) as high_priority_alerts,
  AVG(
    CASE
      WHEN status = 'resolved' THEN EXTRACT(
        EPOCH
        FROM (updated_at - created_at)
      ) / 60
      ELSE NULL
    END
  ) as avg_response_time_minutes
FROM public.alerts;
-- Create function to get alert trends
CREATE OR REPLACE FUNCTION public.get_alert_trends(days_back INTEGER DEFAULT 7) RETURNS TABLE(
    date DATE,
    total_count BIGINT,
    medical_count BIGINT,
    fire_count BIGINT,
    security_count BIGINT,
    other_count BIGINT
  ) AS $$ BEGIN RETURN QUERY
SELECT DATE(created_at) as date,
  COUNT(*) as total_count,
  COUNT(*) FILTER (
    WHERE emergency_type = 'medical'
  ) as medical_count,
  COUNT(*) FILTER (
    WHERE emergency_type = 'fire'
  ) as fire_count,
  COUNT(*) FILTER (
    WHERE emergency_type = 'security'
  ) as security_count,
  COUNT(*) FILTER (
    WHERE emergency_type = 'other'
  ) as other_count
FROM public.alerts
WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
GROUP BY DATE(created_at)
ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create function to get response time analytics
CREATE OR REPLACE FUNCTION public.get_response_time_analytics(days_back INTEGER DEFAULT 7) RETURNS TABLE(
    emergency_type TEXT,
    avg_response_seconds NUMERIC,
    min_response_seconds NUMERIC,
    max_response_seconds NUMERIC,
    total_resolved BIGINT
  ) AS $$ BEGIN RETURN QUERY
SELECT a.emergency_type,
  AVG(
    EXTRACT(
      EPOCH
      FROM (a.updated_at - a.created_at)
    )
  )::NUMERIC as avg_response_seconds,
  MIN(
    EXTRACT(
      EPOCH
      FROM (a.updated_at - a.created_at)
    )
  )::NUMERIC as min_response_seconds,
  MAX(
    EXTRACT(
      EPOCH
      FROM (a.updated_at - a.created_at)
    )
  )::NUMERIC as max_response_seconds,
  COUNT(*) as total_resolved
FROM public.alerts a
WHERE a.status = 'resolved'
  AND a.created_at >= NOW() - (days_back || ' days')::INTERVAL
  AND a.updated_at > a.created_at
GROUP BY a.emergency_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- 4. PUSH NOTIFICATIONS SUBSCRIPTION TABLE
-- ============================================
-- Create table for push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, endpoint)
);
-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- RLS policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
-- ============================================
-- 5. REALTIME PUBLICATION SETUP
-- ============================================
-- Enable realtime for all dashboard tables
ALTER PUBLICATION supabase_realtime
ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.responders;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.responder_locations;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.chat_messages;
-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================
-- Function to create notification when alert is created
CREATE OR REPLACE FUNCTION public.notify_alert_created() RETURNS TRIGGER AS $$
DECLARE nearby_responder RECORD;
BEGIN -- Notify all active responders within response radius
FOR nearby_responder IN
SELECT r.user_id
FROM public.responders r
WHERE r.active = TRUE
  AND r.verification_status = 'verified' LOOP
INSERT INTO public.notifications (
    user_id,
    alert_id,
    title,
    body,
    message,
    type,
    priority,
    read
  )
VALUES (
    nearby_responder.user_id,
    NEW.id,
    'New Emergency Alert',
    'A new ' || COALESCE(NEW.emergency_type, 'emergency') || ' alert has been created',
    'Emergency alert: ' || COALESCE(NEW.message, 'No details provided'),
    'alert',
    CASE
      WHEN NEW.urgency_level = 'critical' THEN 'urgent'
      WHEN NEW.urgency_level = 'high' THEN 'high'
      ELSE 'normal'
    END,
    false
  );
END LOOP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to create notifications on alert creation
DROP TRIGGER IF EXISTS on_alert_created ON public.alerts;
CREATE TRIGGER on_alert_created
AFTER
INSERT ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.notify_alert_created();
-- Function to update responder last_active timestamp
CREATE OR REPLACE FUNCTION public.update_responder_last_active() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.responders
SET last_active = NOW()
WHERE id = NEW.responder_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to update last_active on location update
DROP TRIGGER IF EXISTS on_responder_location_update ON public.responder_locations;
CREATE TRIGGER on_responder_location_update
AFTER
INSERT
  OR
UPDATE ON public.responder_locations FOR EACH ROW EXECUTE FUNCTION public.update_responder_last_active();
-- ============================================
-- 7. SAMPLE DATA FOR TESTING
-- ============================================
-- Insert sample responders (only if table is empty)
INSERT INTO public.responders (
    id,
    organization,
    name,
    type,
    status,
    active,
    current_location,
    verification_status
  )
SELECT gen_random_uuid(),
  'BridgeX Emergency Response',
  'Team ' || team_name,
  team_type,
  team_status,
  true,
  'Zone ' || floor(random() * 5 + 1)::TEXT,
  'verified'
FROM (
    VALUES ('Alpha', 'medical', 'on-duty'),
      ('Bravo', 'fire', 'responding'),
      ('Charlie', 'police', 'responding'),
      ('Delta', 'rescue', 'on-duty'),
      ('Echo', 'general', 'off-duty')
  ) AS teams(team_name, team_type, team_status)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.responders
    LIMIT 1
  );
-- Grant necessary permissions
GRANT SELECT ON public.dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_alert_trends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_response_time_analytics TO authenticated;
-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$ BEGIN RAISE NOTICE '✅ Dashboard real-time features SQL completed successfully!';
RAISE NOTICE '📊 Analytics views and functions created';
RAISE NOTICE '🔔 Notification system enhanced';
RAISE NOTICE '👥 Responder tracking enabled';
RAISE NOTICE '⚡ Realtime subscriptions configured';
END $$;