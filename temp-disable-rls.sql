-- Temporarily disable RLS for testing
-- Run this in Supabase SQL Editor
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
-- Now test the insert, then re-enable:
-- ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;