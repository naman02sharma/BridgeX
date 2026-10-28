import { createClient } from "@supabase/supabase-js"

/**
 * Supabase client for API routes (server only).
 * Uses the service-role key when available so inserts work for guests and for
 * logged-in users alike (API routes have no browser session, so row-level
 * security would otherwise treat every request as anonymous).
 * Never import this from a client component.
 */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Supabase environment variables are missing")
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
