-- Sample Data for Testing BridgeX Realtime Features
-- Run this AFTER the main migration in Supabase SQL Editor
-- Create matching demo auth users first (profiles.id references auth.users.id).
-- These are demo accounts with random passwords; they cannot be used to log in.
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
SELECT v.id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', v.email, crypt(gen_random_uuid()::text, gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  NOW(), NOW()
FROM (VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'user@example.com'),
  ('550e8400-e29b-41d4-a716-446655440001', 'responder1@example.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'responder2@example.com')
) AS v(id, email)
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.id::uuid);
-- Insert sample profiles
INSERT INTO public.profiles (
    id,
    email,
    role,
    organization,
    verified,
    languages
  )
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'user@example.com',
    'user',
    'Test User',
    true,
    ARRAY ['en', 'es']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'responder1@example.com',
    'responder',
    'Red Cross',
    true,
    ARRAY ['en', 'fr', 'es']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'responder2@example.com',
    'responder',
    'Fire Dept',
    true,
    ARRAY ['en', 'de']
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, role = EXCLUDED.role,
    organization = EXCLUDED.organization, verified = EXCLUDED.verified,
    languages = EXCLUDED.languages;
-- Insert sample responders
INSERT INTO public.responders (
    id,
    user_id,
    organization,
    verification_status,
    specializations,
    response_radius,
    active
  )
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Red Cross',
    'verified',
    ARRAY ['medical', 'first_aid'],
    25,
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Fire Dept',
    'verified',
    ARRAY ['fire', 'rescue'],
    30,
    true
  );
-- Insert sample responder locations (for realtime tracking)
INSERT INTO public.responder_locations (
    responder_id,
    latitude,
    longitude,
    status,
    accuracy,
    active
  )
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    27.1767,
    75.9846,
    'available',
    10.5,
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    27.1567,
    76.0046,
    'available',
    8.2,
    true
  );
-- Insert sample alert
INSERT INTO public.alerts (
    id,
    user_id,
    emergency_type,
    urgency_level,
    message,
    original_message,
    language_code,
    location,
    status,
    responders
  )
VALUES (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'medical',
    'high',
    'Medical emergency - unconscious person',
    'Medical emergency - unconscious person',
    'en',
    '{"lat": 27.1667, "lng": 75.9846, "address": "Jaipur, Rajasthan, India"}',
    'active',
    ARRAY ['550e8400-e29b-41d4-a716-446655440001']::uuid[]
  );
-- Insert sample chat messages
INSERT INTO public.chat_messages (alert_id, sender_id, content, message_type)
VALUES (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Please help! Someone is unconscious.',
    'text'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'On my way. ETA 5 minutes.',
    'text'
  );
-- Insert sample notifications
INSERT INTO public.notifications (user_id, alert_id, title, body, read)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    'New Emergency Alert',
    'Medical emergency in your area',
    false
  );