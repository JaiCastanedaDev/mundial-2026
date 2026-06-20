import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/partidos" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp({
          email,
          password,
          displayName,
        })

        setSuccess('Cuenta creada. Si tu proyecto requiere confirmación por correo, revisa tu email antes de entrar.')
      } else {
        await signIn(email, password)
      }
    } catch (submitError) {
      setError(
        mode === 'signup'
          ? 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.'
          : 'Credenciales inválidas. Verifica tu correo y contraseña.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary bg-pitch bg-pitch px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
            ⚽
          </div>
          <h1 className="font-display text-5xl uppercase">Polla Mundialista 2026</h1>
          <p className="mt-3 text-sm text-white/70">
            {mode === 'signup' ? 'Crea tu cuenta para entrar al torneo.' : 'Ingresa con tu cuenta.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setSuccess('')
            }}
            className={[
              'rounded-md px-3 py-2 text-sm font-semibold transition',
              mode === 'signin' ? 'bg-white text-slate-950' : 'text-white/75',
            ].join(' ')}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
              setSuccess('')
            }}
            className={[
              'rounded-md px-3 py-2 text-sm font-semibold transition',
              mode === 'signup' ? 'bg-white text-slate-950' : 'text-white/75',
            ].join(' ')}
          >
            Registrarse
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">Nombre</span>
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35"
                placeholder="Tu nombre"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35"
              placeholder="tu-correo@ejemplo.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35"
              placeholder="••••••••"
              required
            />
          </label>

          {success ? <p className="rounded-lg bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}
          {error ? <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-[#f6b785] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {mode === 'signup' ? 'Crear cuenta' : 'Entrar al torneo'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          {mode === 'signup' ? 'Usa un correo válido para recuperar acceso luego.' : '¿Olvidaste tu contraseña? Habla con el organizador.'}
        </p>
      </div>
    </div>
  )
}
