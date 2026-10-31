import { createClient } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = "user" | "victim" | "responder" | "hospital" | "fire" | "police" | "volunteer" | "ngo" | "admin" | string

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  organization?: string
  phone?: string
  specialization?: string
  specializations?: string[]
  verified: boolean
  createdAt: Date
}

export interface Session {
  user: User
  token: string
  expiresAt: Date
}

// Convert Supabase user to our User type
export function convertSupabaseUser(supabaseUser: SupabaseUser, profile?: any, responder?: any): User {
  const role = profile?.role || supabaseUser.user_metadata?.role || 'user'
  const specs = responder?.specializations || (profile?.role && profile.role !== 'user' ? [profile.role] : [])
  const primarySpec = specs[0] || (role !== 'user' ? role : undefined)

  return {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    name: profile?.name || supabaseUser.user_metadata?.name,
    role,
    organization: responder?.organization || profile?.organization || supabaseUser.user_metadata?.organization,
    phone: profile?.phone || supabaseUser.user_metadata?.phone,
    specialization: primarySpec,
    specializations: specs,
    verified: responder ? responder.verification_status === 'verified' : (profile?.verified || false),
    createdAt: new Date(supabaseUser.created_at),
  }
}

export const supabase = createClient()

export const signUp = async (
  email: string,
  password: string,
  metadata?: { name?: string; role?: UserRole; phone?: string; organization?: string }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) throw error

  if (data?.user?.id) {
    try {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        name: metadata?.name || null,
        role: metadata?.role || "user",
        organization: metadata?.organization || null,
        phone: metadata?.phone || null,
        created_at: new Date().toISOString(),
      })

      if (metadata?.role && metadata.role !== "user") {
        const roleSpecs: Record<string, string[]> = {
          hospital: ["medical", "trauma", "first-aid", "hospital"],
          fire: ["fire", "rescue", "firefighter"],
          police: ["security", "rescue", "support", "police"],
          volunteer: ["first-aid", "support", "rescue", "medical"],
          ngo: ["support", "rescue", "medical"],
          responder: ["medical", "fire", "security", "rescue", "first-aid", "trauma"],
        }
        const specs = roleSpecs[metadata.role] || ["support", "first-aid", "rescue"]
        try {
          await supabase.from("responders").upsert({
            user_id: data.user.id,
            organization: metadata.organization || metadata.name || "Emergency Services",
            specializations: specs,
            response_radius: 30,
            verification_status: "verified",
            active: true,
            last_active: new Date().toISOString(),
          }, { onConflict: "user_id" })
        } catch (respErr) {
          console.warn("Responder profile sync on signup:", respErr)
        }
      }
    } catch (profErr) {
      console.warn("Profile sync on signup:", profErr)
    }
  }

  return data
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error.message)
      throw new Error(error.message || 'Invalid login credentials')
    }
    return data
  } catch (err) {
    console.error('Sign in failed:', err)
    throw err
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return convertSupabaseUser(user, profile)
}

export const getSession = async (): Promise<Session | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) return null

  // Get authenticated user data
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return null

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const convertedUser = convertSupabaseUser(user, profile)

  return {
    user: convertedUser,
    token: session.access_token,
    expiresAt: new Date(session.expires_at! * 1000),
  }
}

// Legacy functions for backward compatibility
export const login = async (email: string, password: string): Promise<Session | null> => {
  try {
    const data = await signIn(email, password)
    if (!data.session) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    const user = convertSupabaseUser(data.user, profile)

    return {
      user,
      token: data.session.access_token,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000) : new Date(Date.now() + 3600000), // Default 1 hour
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export const logout = signOut

export const register = async (data: {
  email: string
  password: string
  name: string
  organization: string
  role: string
}): Promise<User> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id: Date.now().toString(),
    email: data.email,
    name: data.name,
    role: "responder",
    organization: data.organization,
    verified: false, // Requires admin verification
    createdAt: new Date(),
  }
}

export const checkRole = (user: User, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(user.role)
}
