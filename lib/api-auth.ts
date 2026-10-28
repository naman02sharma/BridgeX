import { getServerSupabase } from "@/lib/supabase-server"

/**
 * Identify the logged-in user from the `Authorization: Bearer <access_token>`
 * header (server only). Returns null for guests / invalid tokens.
 */
export async function getRequestUser(request: Request): Promise<{ id: string; email?: string } | null> {
  const header = request.headers.get("authorization") || ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
  if (!token) return null
  try {
    const { data, error } = await getServerSupabase().auth.getUser(token)
    if (error || !data?.user) return null
    return { id: data.user.id, email: data.user.email ?? undefined }
  } catch {
    return null
  }
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
