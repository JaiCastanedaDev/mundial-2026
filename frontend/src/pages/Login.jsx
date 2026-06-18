import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/partidos" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (submitError) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.')
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
            Ingresa con tu cuenta asignada por el organizador.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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

          {error ? <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-[#f6b785] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Entrar al torneo
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          ¿Olvidaste tu contraseña? Habla con el organizador.
        </p>
      </div>
    </div>
  )
}
