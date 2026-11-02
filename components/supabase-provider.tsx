"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@/lib/auth'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  loading: boolean
}

import { convertSupabaseUser } from '@/lib/auth'

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFullUser = async (rawUser: any) => {
      if (!rawUser) {
        setUser(null)
        setLoading(false)
        return
      }

      // First set immediate metadata-based user
      const immediateUser = convertSupabaseUser(rawUser)
      setUser(immediateUser)
      if (typeof window !== "undefined" && rawUser?.email) {
        try { localStorage.setItem("bridgex_user_email", rawUser.email) } catch {}
      }

      // Asynchronously enrich with database profile and responder info
      try {
        const [{ data: profile }, { data: responder }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', rawUser.id).maybeSingle(),
          supabase.from('responders').select('*').eq('user_id', rawUser.id).maybeSingle()
        ])
        setUser(convertSupabaseUser(rawUser, profile, responder))
      } catch (err) {
        console.warn('[SupabaseProvider] Could not enrich user profile:', err)
      } finally {
        setLoading(false)
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      await loadFullUser(session?.user)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        const currentUserId = session?.user?.id || null
        if (typeof window !== "undefined") {
          const previousUserId = localStorage.getItem("bridgex_user_id")
          if (previousUserId && previousUserId !== currentUserId) {
            // User switched accounts! Purge all previous account cached state
            try {
              localStorage.removeItem("bridgex_user_coords")
              localStorage.removeItem(`bridgex_coords_${previousUserId}`)
              localStorage.removeItem("bridgex_user_phone")
              localStorage.removeItem("bridgex_user_name")
              localStorage.removeItem("bridgex_user_role")
              localStorage.removeItem("bridgex_active_sos_id")
              localStorage.removeItem("bridgex_selected_city")
            } catch {}
          }
          if (currentUserId) {
            localStorage.setItem("bridgex_user_id", currentUserId)
          } else {
            localStorage.removeItem("bridgex_user_id")
            localStorage.removeItem("bridgex_user_coords")
          }
        }
        await loadFullUser(session?.user)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const value = {
    supabase,
    user,
    session,
    loading,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}