import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function slugifyUsername(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18)
}

function buildProfileDefaults(user) {
  const email = user?.email ?? ''
  const emailPrefix = email.split('@')[0] ?? 'usuario'
  const baseUsername = slugifyUsername(user?.user_metadata?.username || emailPrefix || 'usuario') || 'usuario'
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || emailPrefix || 'Usuario'

  return {
    username: `${baseUsername}${String(user.id).replace(/-/g, '').slice(0, 6)}`,
    display_name: displayName,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const [{ data: sessionData }, profileData] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ])

      if (!active) return

      setSession(sessionData.session)

      if (profileData.data.user) {
        await loadProfile(profileData.data.user.id, profileData.data.user)
      } else {
        setLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id, nextSession.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId, user = null) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error loading profile', error)
    }

    if (!data && user) {
      const defaults = buildProfileDefaults(user)
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: defaults.username,
          display_name: defaults.display_name,
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating profile', createError)
        setProfile(null)
      } else {
        setProfile(createdProfile)
      }
    } else {
      setProfile(data ?? null)
    }

    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp({ email, password, displayName }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          full_name: displayName,
        },
      },
    })

    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo(
    () => ({ session, profile, loading, signIn, signUp, signOut }),
    [loading, profile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
