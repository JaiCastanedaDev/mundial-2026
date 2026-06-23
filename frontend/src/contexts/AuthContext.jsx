import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    async function bootstrap() {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession()

        if (error) throw error
        if (!isMountedRef.current) return

        const nextSession = sessionData.session
        setSession(nextSession)
        setLoading(false)

        if (nextSession?.user?.id) {
          void loadProfile(nextSession.user.id, nextSession.user)
        } else {
          setProfile(null)
        }
      } catch (bootstrapError) {
        console.error('Error bootstrapping auth session', bootstrapError)
        if (!isMountedRef.current) return
        setSession(null)
        setProfile(null)
        setLoading(false)
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMountedRef.current) return

      setSession(nextSession)
      setLoading(false)

      if (nextSession?.user?.id) {
        void loadProfile(nextSession.user.id, nextSession.user)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId, user = null) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile', error)
      }

      if (!isMountedRef.current) return null

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
          if (isMountedRef.current) setProfile(null)
          return null
        }

        if (isMountedRef.current) setProfile(createdProfile)
        return createdProfile
      }

      if (isMountedRef.current) {
        setProfile(data ?? null)
      }

      return data ?? null
    } catch (profileError) {
      console.error('Unexpected profile loading error', profileError)
      if (isMountedRef.current) setProfile(null)
      return null
    }
  }

  async function refreshProfile() {
    const userId = session?.user?.id
    if (!userId) return
    await loadProfile(userId, session?.user ?? null)
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
    () => ({ session, profile, loading, signIn, signUp, signOut, refreshProfile }),
    [loading, profile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
