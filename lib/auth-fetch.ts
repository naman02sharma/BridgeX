import { supabase } from "@/lib/supabase"

/** fetch() that automatically sends the logged-in user's access token to our API routes. */
export async function authFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  return fetch(input, { ...init, headers })
}
