import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import friendPhoto from '../assets/login-friend.png'

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
    <div className="flex min-h-screen items-center justify-center bg-primary bg-pitch px-4 py-8 text-ink">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-primary/60 shadow-2xl backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <section className="relative min-h-[360px] border-b border-border md:min-h-[720px] md:border-b-0 md:border-r">
          <img src={friendPhoto} alt="Invitado especial del torneo" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,22,0.08)_0%,rgba(3,31,22,0.74)_48%,rgba(3,31,22,0.94)_100%)]" />
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
            <div className="mb-4 inline-flex w-fit items-center rounded-full border border-[#8b7449] bg-primary/70 px-4 py-2 text-sm font-semibold text-accent backdrop-blur">
              Veedor oficial del torneo
            </div>
            <h1 className="max-w-md font-display text-4xl text-ink sm:text-6xl">Polla Mundialista 2026</h1>
            <p className="mt-4 max-w-md text-lg leading-tight text-ink/85">
              La plataforma está bajo estricta supervisión técnica. Sí, la foto está puesta a propósito.
            </p>
            <p className="mt-3 max-w-md text-sm text-accent-dark">
              Si alguien pregunta, dile que esto fue aprobado por el comité disciplinario y por el amigo de la foto.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-8 md:p-10">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full border border-[#8b7449] bg-accent/12 px-4 py-2 text-sm font-semibold text-accent">
              Acceso privado
            </div>
            <h2 className="mt-4 font-display text-4xl text-ink">{mode === 'signup' ? 'Crea tu cuenta' : 'Entra al torneo'}</h2>
            <p className="mt-3 text-sm text-muted">
              {mode === 'signup' ? 'Regístrate para empezar a lanzar tus resultados.' : 'Ingresa con tu correo para seguir la pelea del ranking.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-surface/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
                setSuccess('')
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                mode === 'signin' ? 'bg-accent text-primary' : 'text-muted hover:text-ink',
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
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                mode === 'signup' ? 'bg-accent text-primary' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              Registrarse
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Nombre</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-xl border border-border bg-primary-light/85 px-4 py-3 text-ink placeholder:text-muted outline-none transition focus:border-accent"
                  placeholder="Tu nombre"
                  required
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-muted">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border bg-primary-light/85 px-4 py-3 text-ink placeholder:text-muted outline-none transition focus:border-accent"
                placeholder="tu-correo@ejemplo.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-muted">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-primary-light/85 px-4 py-3 text-ink placeholder:text-muted outline-none transition focus:border-accent"
                placeholder="••••••••"
                required
              />
            </label>

            {success ? <p className="rounded-xl border border-[#2f5c46] bg-[#173327] px-4 py-3 text-sm text-[#9be1b5]">{success}</p> : null}
            {error ? <p className="rounded-xl border border-[#6f2e28] bg-[#3c1714] px-4 py-3 text-sm text-[#ff9b8d]">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-primary transition hover:bg-[#ffd89d] disabled:cursor-not-allowed disabled:bg-primary-light disabled:text-muted"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {mode === 'signup' ? 'Crear cuenta' : 'Entrar al torneo'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            {mode === 'signup' ? 'Usa un correo válido para recuperar acceso luego.' : '¿Olvidaste tu contraseña? Habla con el organizador.'}
          </p>
        </section>
      </div>
    </div>
  )
}
