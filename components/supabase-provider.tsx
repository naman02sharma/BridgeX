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