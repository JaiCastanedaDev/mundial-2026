import { Award, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

function Avatar({ name, color, className = 'h-10 w-10 text-sm' }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map((value) => value[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={['flex items-center justify-center rounded-full font-semibold text-white', className].join(' ')}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}

function formatPoints(points) {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`
  return String(points)
}

function buildSubtitle(row, isCurrentUser) {
  const totalMatches = row.total_predicted + row.total_missed

  if (isCurrentUser) {
    if (row.position <= 3) return 'Sigues en zona de podio.'
    if (row.position <= 10) return 'Sigues peleando arriba.'
    return 'Tus predicciones siguen en juego.'
  }

  if (totalMatches === 0) return 'Sin predicciones todavía'
  if (row.exact_scores > 0) return `${row.exact_scores} exactos · ${row.correct_results} aciertos`
  return `${row.correct_results} aciertos en ${totalMatches} partidos`
}

function PodiumCard({ row, rank, featured = false }) {
  const valueClasses = featured ? 'text-4xl text-accent sm:text-5xl lg:text-6xl' : 'text-3xl text-ink sm:text-4xl'

  return (
    <Link
      to={`/perfil/${row.username}`}
      className={[
        'group flex w-full flex-col items-center transition',
        featured ? '' : 'pt-6 sm:pt-12',
      ].join(' ')}
    >
      <div className="relative">
        {!featured ? (
          <div className="absolute -bottom-1 -right-1 rounded-full border border-border bg-[#4d5d55] px-2.5 py-1 text-base font-bold text-ink shadow-sm sm:px-3 sm:text-xl">
            #{rank}
          </div>
        ) : null}
        <div
          className={[
            'flex items-center justify-center rounded-full border-4',
            featured
              ? 'h-32 w-32 border-accent bg-primary-light shadow-[0_0_44px_rgba(244,207,139,0.28)] sm:h-40 sm:w-40 lg:h-44 lg:w-44'
              : 'h-20 w-20 border-[#61736a] bg-surface/90 sm:h-24 sm:w-24',
          ].join(' ')}
        >
          <Avatar
            name={row.display_name}
            color={row.avatar_color}
            className={featured ? 'h-24 w-24 text-3xl sm:h-28 sm:w-28 sm:text-4xl lg:h-32 lg:w-32' : 'h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl'}
          />
        </div>
        {featured ? (
          <div className="absolute -top-7 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-accent bg-primary p-2 text-accent shadow-[0_0_30px_rgba(244,207,139,0.2)] sm:-top-10">
            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        ) : null}
      </div>

      {featured ? (
        <div className="mt-3 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:mt-4 sm:px-6 sm:py-2 sm:text-sm">
          Winner
        </div>
      ) : null}

      <p className={featured ? 'mt-4 text-center text-2xl font-semibold text-accent transition group-hover:text-[#ffe1a6] sm:text-3xl' : 'mt-3 text-center text-xl font-semibold text-ink transition group-hover:text-accent sm:text-2xl'}>
        {row.display_name}
      </p>
      {!featured ? <p className="mt-1 text-sm text-muted">@{row.username}</p> : null}

      <div
        className={[
          'mt-4 w-full rounded-[28px] border px-4 text-center sm:px-6',
          featured
            ? 'border-[#857450] bg-[#55573f] py-6 sm:py-8'
            : 'border-border bg-surface/82 py-5 sm:py-6',
        ].join(' ')}
      >
        <p className={['font-display uppercase', valueClasses].join(' ')}>{formatPoints(row.total_points)}</p>
        <p className={featured ? 'mt-2 text-base uppercase tracking-[0.22em] text-accent-dark sm:text-lg' : 'mt-2 text-xs uppercase tracking-[0.22em] text-muted sm:text-sm'}>
          Points
        </p>
      </div>
    </Link>
  )
}

function RankingRow({ row, currentUserId }) {
  const isCurrentUser = row.id === currentUserId
  const subtitle = buildSubtitle(row, isCurrentUser)

  return (
    <Link
      to={`/perfil/${row.username}`}
      className={[
        'relative flex flex-wrap items-center gap-3 overflow-hidden rounded-[26px] border px-4 py-4 transition hover:border-accent/45 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-5',
        isCurrentUser
          ? 'border-[#7b6842] bg-[#08251b]'
          : 'border-border bg-surface/82',
      ].join(' ')}
    >
      {isCurrentUser ? <div className="absolute inset-y-0 left-0 w-2 rounded-l-[26px] bg-accent" /> : null}
      <div className={['w-10 text-3xl font-semibold sm:w-16 sm:text-5xl', isCurrentUser ? 'text-accent' : 'text-muted/35'].join(' ')}>
        {String(row.position).padStart(2, '0')}
      </div>
      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-2xl border p-2 sm:h-[72px] sm:w-[72px]',
          isCurrentUser ? 'border-[#8b7449] bg-[#0d3427]' : 'border-border bg-primary-light/80',
        ].join(' ')}
      >
        <Avatar name={row.display_name} color={row.avatar_color} className="h-10 w-10 text-sm sm:h-12 sm:w-12 sm:text-base" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={['truncate text-lg font-semibold sm:text-2xl', isCurrentUser ? 'text-accent' : 'text-ink'].join(' ')}>
          {isCurrentUser ? `You (${row.display_name})` : row.display_name}
        </p>
        <p className={['text-sm leading-5 sm:truncate sm:text-base', isCurrentUser ? 'text-accent-dark/90' : 'text-muted'].join(' ')}>
          {subtitle}
        </p>
      </div>
      <div className="w-full border-t border-white/10 pt-3 text-left sm:w-auto sm:border-t-0 sm:pt-0 sm:text-right">
        <p className={['font-display text-3xl uppercase sm:text-5xl', isCurrentUser ? 'text-accent' : 'text-ink'].join(' ')}>
          {row.total_points.toLocaleString('en-US')}
        </p>
        <p className={['mt-1 text-sm font-semibold sm:text-lg', isCurrentUser ? 'text-accent' : 'text-muted'].join(' ')}>
          {isCurrentUser ? 'Stable' : `${row.correct_results} aciertos`}
        </p>
      </div>
    </Link>
  )
}

export default function RankingTable({ rows, currentUserId }) {
  const topThree = rows.slice(0, 3)
  const restRows = rows.slice(3)
  const featured = topThree[0]
  const left = topThree[1]
  const right = topThree[2]

  return (
    <div className="space-y-6 sm:space-y-8">
      {featured ? (
        <div className="px-2 pt-2 sm:pt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:items-end">
            {left ? <PodiumCard row={left} rank={2} /> : <div />}
            <PodiumCard row={featured} rank={1} featured />
            {right ? <PodiumCard row={right} rank={3} /> : <div />}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted sm:text-sm sm:tracking-[0.28em]">Global Rankings</p>
        <SlidersHorizontal className="h-4 w-4 text-muted" />
      </div>

      <div className="space-y-4">
        {restRows.map((row) => (
          <RankingRow key={row.id} row={row} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  )
}
