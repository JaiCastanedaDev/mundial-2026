import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, CheckCircle2, Medal, Pencil, Target, Trophy, UserRound } from 'lucide-react'
import { useParams } from 'react-router-dom'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from '../hooks/useMatches'
import { useProfileByUsername, useUpdateProfile } from '../hooks/useProfiles'
import { buildPerformanceSummary, getUserPrediction } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'
import { translateMatchStatusLabel, translateStageLabel } from '../lib/labels'

const WORLD_CUP_2026_START = new Date('2026-06-11T00:00:00Z')
const WORLD_CUP_2026_END = new Date('2026-07-20T00:00:00Z')
const AVATAR_COLORS = ['#f4cf8b', '#3B82F6', '#7ed9a3', '#ff6b57', '#d7b06c', '#8b5cf6', '#14b8a6', '#ec4899']

function isWorldCupMatch(match) {
  const matchDate = new Date(match.match_date)
  const hasValidDate = !Number.isNaN(matchDate.getTime())
  return hasValidDate && matchDate >= WORLD_CUP_2026_START && matchDate < WORLD_CUP_2026_END
}

function buildInitials(name) {
  return (
    name
      ?.split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() ?? '?'
  )
}

function buildProfileStats(summary, rankingEntry, totalPredictions) {
  const attempts = summary.exact + summary.correct + summary.wrong
  const precision = attempts > 0 ? ((summary.exact + summary.correct) / attempts) * 100 : 0

  return [
    {
      key: 'position',
      label: 'Posición',
      value: rankingEntry?.position ? `#${rankingEntry.position}` : '-',
      icon: Medal,
      tone: 'text-accent',
    },
    {
      key: 'points',
      label: 'Puntos',
      value: rankingEntry?.total_points ?? 0,
      icon: Trophy,
      tone: 'text-accent-dark',
    },
    {
      key: 'submitted',
      label: 'Predicciones',
      value: totalPredictions,
      icon: CalendarDays,
      tone: 'text-ink',
    },
    {
      key: 'exact',
      label: 'Exactos',
      value: summary.exact,
      icon: CheckCircle2,
      tone: 'text-success',
    },
    {
      key: 'correct',
      label: 'Aciertos',
      value: summary.correct,
      icon: Target,
      tone: 'text-accent',
    },
    {
      key: 'precision',
      label: 'Precisión',
      value: `${precision.toFixed(1)}%`,
      icon: UserRound,
      tone: 'text-muted',
    },
  ]
}

function ProfileStatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl border border-border bg-primary-light/70 p-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className={['h-4 w-4', tone].join(' ')} />
        <span>{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl uppercase text-ink sm:text-4xl">{value}</p>
    </div>
  )
}

function ProfileMatchCard({ match, prediction, isOwnProfile }) {
  const isFinished = match.status === 'finished'
  const statusLabel =
    match.status === 'live'
      ? 'En vivo'
      : match.status === 'finished'
        ? 'Finalizado'
        : format(new Date(match.match_date), "d MMM yyyy, HH:mm", { locale: es })

  const actualHomeScore = match.home_score_ft ?? match.home_score
  const actualAwayScore = match.away_score_ft ?? match.away_score

  return (
    <article className="rounded-2xl border border-border bg-surface/82 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{translateStageLabel(match.stage)}</p>
          <p className="mt-1 text-sm text-muted">{statusLabel}</p>
        </div>
        <span
          className={[
            'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            match.status === 'finished'
              ? 'border-[#30553f] bg-[#173327] text-success'
              : match.status === 'live'
                ? 'border-[#6f2e28] bg-[#3c1714] text-live'
                : 'border-border bg-primary-light/60 text-muted',
          ].join(' ')}
        >
          {translateMatchStatusLabel(match.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-primary/55 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{match.home_team}</p>
            </div>
            <div className="font-display text-3xl uppercase text-accent">
              {isFinished ? actualHomeScore ?? 0 : prediction?.predicted_home_score ?? '-'}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-primary/55 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{match.away_team}</p>
            </div>
            <div className="font-display text-3xl uppercase text-accent">
              {isFinished ? actualAwayScore ?? 0 : prediction?.predicted_away_score ?? '-'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-primary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Elección</p>
          {prediction ? (
            <>
              <p className="mt-2 font-display text-4xl uppercase text-ink">
                {prediction.predicted_home_score} - {prediction.predicted_away_score}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Puntos del partido</p>
              <p className="mt-2 font-display text-3xl uppercase text-accent">
                {prediction.is_calculated ? prediction.points_earned ?? 0 : '-'}
              </p>
              <p className="mt-2 text-sm text-muted">
                {prediction.is_calculated
                  ? prediction.points_earned > 0
                    ? 'Predicción sumada al ranking.'
                    : 'No sumó puntos en este partido.'
                  : 'Pendiente de cálculo oficial.'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-2xl uppercase text-muted">Sin elección</p>
              <p className="mt-4 text-sm text-muted">
                {isOwnProfile ? 'Todavía no enviaste una predicción para este partido.' : 'Este usuario no registró una predicción para este partido.'}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Profile() {
  const { username } = useParams()
  const { profile, refreshProfile } = useAuth()
  const { data: ranking = [], isLoading: rankingLoading, error: rankingError } = useRanking()
  const { data: matches = [], isLoading: matchesLoading, error: matchesError } = useMatches()
  const viewedProfileQuery = useProfileByUsername(username, { enabled: Boolean(username) })
  const updateProfile = useUpdateProfile()

  const [editingOpen, setEditingOpen] = useState(false)
  const [formState, setFormState] = useState({ display_name: '', username: '', avatar_color: AVATAR_COLORS[0] })
  const [filter, setFilter] = useState('all')

  const viewedProfile = username ? viewedProfileQuery.data : profile
  const isOwnProfile = !username || viewedProfile?.id === profile?.id

  useEffect(() => {
    if (!profile) return
    setFormState({
      display_name: profile.display_name ?? '',
      username: profile.username ?? '',
      avatar_color: profile.avatar_color ?? AVATAR_COLORS[0],
    })
  }, [profile])

  const rankingEntry = useMemo(() => {
    if (!viewedProfile) return null
    return ranking.find((entry) => entry.id === viewedProfile.id || entry.username === viewedProfile.username) ?? null
  }, [ranking, viewedProfile])

  const worldCupMatches = useMemo(() => matches.filter(isWorldCupMatch), [matches])

  const predictionRows = useMemo(() => {
    if (!viewedProfile?.id) return []

    return worldCupMatches
      .map((match) => ({
        ...match,
        prediction: getUserPrediction(match, viewedProfile.id),
      }))
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
  }, [viewedProfile?.id, worldCupMatches])

  const filteredRows = useMemo(() => {
    if (filter === 'predicted') return predictionRows.filter((row) => row.prediction)
    if (filter === 'finished') return predictionRows.filter((row) => row.status === 'finished')
    if (filter === 'upcoming') return predictionRows.filter((row) => row.status !== 'finished')
    return predictionRows
  }, [filter, predictionRows])

  const summary = useMemo(
    () => buildPerformanceSummary(worldCupMatches, viewedProfile?.id),
    [viewedProfile?.id, worldCupMatches],
  )

  const totalPredictions = useMemo(
    () => predictionRows.filter((row) => row.prediction).length,
    [predictionRows],
  )

  const stats = useMemo(
    () => buildProfileStats(summary, rankingEntry, totalPredictions),
    [rankingEntry, summary, totalPredictions],
  )

  async function handleSaveProfile(event) {
    event.preventDefault()

    await updateProfile.mutateAsync({
      userId: profile.id,
      updates: {
        display_name: formState.display_name.trim(),
        username: formState.username.trim().toLowerCase(),
        avatar_color: formState.avatar_color,
      },
    })

    await refreshProfile()
    setEditingOpen(false)
  }

  if (matchesLoading || rankingLoading || (username && viewedProfileQuery.isLoading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Cargando perfil" />
      </div>
    )
  }

  if (matchesError || rankingError || viewedProfileQuery.error) {
    const message = matchesError?.message ?? rankingError?.message ?? viewedProfileQuery.error?.message
    return <div className="panel p-6 text-[#ff9f92]">No se pudo cargar el perfil: {message}</div>
  }

  if (!viewedProfile) {
    return <div className="panel p-6 text-muted">No encontramos ese perfil.</div>
  }

  return (
    <section className="space-y-6 pb-6">
      <div className="panel overflow-hidden">
        <div className="border-b border-border bg-primary-light/40 px-5 py-4 sm:px-6">
          <p className="text-sm text-muted">{isOwnProfile ? 'Tu perfil' : 'Perfil público'}</p>
        </div>
        <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white sm:h-24 sm:w-24 sm:text-3xl"
                style={{ backgroundColor: viewedProfile.avatar_color ?? AVATAR_COLORS[0] }}
              >
                {buildInitials(viewedProfile.display_name)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-4xl uppercase text-ink sm:text-6xl">
                  {viewedProfile.display_name}
                </h1>
                <p className="mt-2 text-lg text-muted">@{viewedProfile.username}</p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              {isOwnProfile
                ? 'Este es tu perfil público dentro de la polla. Desde aquí puedes revisar tu rendimiento completo, cómo vas en el ranking y qué elegiste en cada partido.'
                : 'Aquí puedes revisar el rendimiento completo de este usuario, sus elecciones partido a partido y los puntos que ha sumado a lo largo del torneo.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-primary-light/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Resumen</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-muted">Posición actual</p>
                <p className="font-display text-5xl uppercase text-accent">
                  {rankingEntry?.position ? `#${rankingEntry.position}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Puntos acumulados</p>
                <p className="font-display text-5xl uppercase text-accent-dark">
                  {rankingEntry?.total_points ?? 0}
                </p>
              </div>
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setEditingOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-primary transition hover:bg-[#ffdca0]"
                >
                  <Pencil className="h-4 w-4" />
                  Editar perfil
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <ProfileStatCard key={stat.key} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} />
        ))}
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">Predicciones por partido</h2>
            <p className="mt-2 text-sm text-muted">
              {isOwnProfile
                ? 'Aquí tienes tu historial completo de elecciones y el puntaje de cada partido.'
                : 'Estas son las elecciones y el puntaje por partido de este participante.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'predicted', label: 'Con elección' },
              { key: 'finished', label: 'Finalizados' },
              { key: 'upcoming', label: 'Pendientes' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className={[
                  'rounded-full px-4 py-2 text-sm transition',
                  filter === option.key
                    ? 'bg-accent text-primary'
                    : 'border border-border bg-surface/80 text-muted hover:text-ink',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredRows.map((row) => (
            <ProfileMatchCard
              key={row.id}
              match={row}
              prediction={row.prediction}
              isOwnProfile={isOwnProfile}
            />
          ))}

          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-primary/45 px-5 py-8 text-center text-muted">
              No hay partidos para este filtro.
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={editingOpen} title="Editar perfil" onClose={() => setEditingOpen(false)}>
        <form className="space-y-4" onSubmit={handleSaveProfile}>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Nombre visible</span>
            <input
              type="text"
              required
              value={formState.display_name}
              onChange={(event) => setFormState((current) => ({ ...current, display_name: event.target.value }))}
              className="w-full rounded-lg border border-border bg-primary px-4 py-3 text-ink outline-none transition focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-muted">Usuario</span>
            <input
              type="text"
              required
              pattern="[a-z0-9_]+"
              value={formState.username}
              onChange={(event) => setFormState((current) => ({ ...current, username: event.target.value.replace(/\s+/g, '').toLowerCase() }))}
              className="w-full rounded-lg border border-border bg-primary px-4 py-3 text-ink outline-none transition focus:border-accent"
            />
            <span className="mt-2 block text-xs text-muted">Solo letras minúsculas, números y guion bajo.</span>
          </label>

          <div>
            <span className="mb-2 block text-sm text-muted">Color del avatar</span>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormState((current) => ({ ...current, avatar_color: color }))}
                  className={[
                    'h-10 w-10 rounded-full border-2 transition',
                    formState.avatar_color === color ? 'border-ink scale-110' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: color }}
                  aria-label={`Seleccionar color ${color}`}
                />
              ))}
            </div>
          </div>

          {updateProfile.error ? (
            <div className="rounded-lg border border-[#6f2e28] bg-[#3c1714] px-4 py-3 text-sm text-[#ff9b8d]">
              {updateProfile.error.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
