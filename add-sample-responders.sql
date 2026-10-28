-- Add Sample Responders for Testing
-- Run this in Supabase SQL Editor AFTER creating a user account
-- This script assumes you have at least one user in auth.users
-- You can find user IDs by running: SELECT id, email FROM auth.users;
DO $$
DECLARE sample_user_id UUID;
BEGIN -- Get the first user from auth.users (or create a specific test user)
SELECT id INTO sample_user_id
FROM auth.users
LIMIT 1;
IF sample_user_id IS NULL THEN RAISE NOTICE 'No users found! Please register at least one user first.';
RAISE NOTICE 'Go to http://localhost:3000/auth/register and create an account.';
RETURN;
END IF;
RAISE NOTICE 'Using user ID: %',
sample_user_id;
-- Ensure the user has a profile (create if missing)
INSERT INTO public.profiles (id, email, role, verified)
SELECT id,
  email,
  'responder',
  true
FROM auth.users
WHERE id = sample_user_id ON CONFLICT (id) DO NOTHING;
RAISE NOTICE 'Profile ensured for user';
-- Insert sample responders
INSERT INTO public.responders (
    user_id,
    organization,
    verification_status,
    specializations,
    active,
    response_radius
  )
VALUES (
    sample_user_id,
    'City Hospital Emergency',
    'verified',
    ARRAY ['medical', 'trauma'],
    true,
    10
  ),
  (
    sample_user_id,
    'Fire Department Station 5',
    'verified',
    ARRAY ['fire', 'rescue'],
    true,
    15
  ),
  (
    sample_user_id,
    'Community First Aid Team',
    'verified',
    ARRAY ['medical', 'support'],
    true,
    8
  ) ON CONFLICT DO NOTHING;
-- Insert sample responder locations (near a central location)
-- Using coordinates around a central point (adjust as needed)
INSERT INTO public.responder_locations (
    responder_id,
    latitude,
    longitude,
    status,
    accuracy
  )
SELECT r.id,
  CASE
    WHEN r.organization LIKE '%Hospital%' THEN 40.7580
    WHEN r.organization LIKE '%Fire%' THEN 40.7620
    ELSE 40.7540
  END,
  CASE
    WHEN r.organization LIKE '%Hospital%' THEN -73.9855
    WHEN r.organization LIKE '%Fire%' THEN -73.9800
    ELSE -73.9900
  END,
  'available',
  10.0
FROM public.responders r
WHERE r.verification_status = 'verified' ON CONFLICT (responder_id) DO
UPDATE
SET latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  status = EXCLUDED.status,
  last_updated = NOW();
RAISE NOTICE '✅ Sample responders added successfully!';
RAISE NOTICE 'Added 3 responders with locations';
END $$;
-- Verify the data
SELECT r.organization,
  r.specializations,
  r.verification_status,
  r.active,
  rl.latitude,
  rl.longitude,
  rl.status
FROM public.responders r
  LEFT JOIN public.responder_locations rl ON rl.responder_id = r.id
WHERE r.verification_status = 'verified';