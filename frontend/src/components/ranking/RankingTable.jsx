import { Award, SlidersHorizontal } from 'lucide-react'

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
  const valueClasses = featured ? 'text-6xl text-accent' : 'text-4xl text-ink'

  return (
    <div className={featured ? 'flex flex-col items-center' : 'flex flex-col items-center pt-12'}>
      <div className="relative">
        {!featured ? (
          <div className="absolute -bottom-1 -right-1 rounded-full border border-border bg-[#4d5d55] px-3 py-1 text-xl font-bold text-ink shadow-sm">
            #{rank}
          </div>
        ) : null}
        <div
          className={[
            'flex items-center justify-center rounded-full border-4',
            featured
              ? 'h-44 w-44 border-accent bg-primary-light shadow-[0_0_44px_rgba(244,207,139,0.28)]'
              : 'h-24 w-24 border-[#61736a] bg-surface/90',
          ].join(' ')}
        >
          <Avatar name={row.display_name} color={row.avatar_color} className={featured ? 'h-32 w-32 text-4xl' : 'h-16 w-16 text-xl'} />
        </div>
        {featured ? (
          <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-2 border-accent bg-primary p-2 text-accent shadow-[0_0_30px_rgba(244,207,139,0.2)]">
            <Award className="h-6 w-6" />
          </div>
        ) : null}
      </div>

      {featured ? (
        <div className="mt-4 rounded-full bg-accent px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Winner
        </div>
      ) : null}

      <p className={featured ? 'mt-4 text-3xl font-semibold text-accent' : 'mt-3 text-2xl font-semibold text-ink'}>
        {row.display_name}
      </p>
      {!featured ? <p className="mt-1 text-sm text-muted">@{row.username}</p> : null}

      <div
        className={[
          'mt-4 w-full rounded-[28px] border px-6 text-center',
          featured
            ? 'border-[#857450] bg-[#55573f] py-8'
            : 'border-border bg-surface/82 py-6',
        ].join(' ')}
      >
        <p className={['font-display uppercase', valueClasses].join(' ')}>{formatPoints(row.total_points)}</p>
        <p className={featured ? 'mt-2 text-lg uppercase tracking-[0.25em] text-accent-dark' : 'mt-2 text-sm uppercase tracking-[0.25em] text-muted'}>
          Points
        </p>
      </div>
    </div>
  )
}

function RankingRow({ row, currentUserId }) {
  const isCurrentUser = row.id === currentUserId
  const subtitle = buildSubtitle(row, isCurrentUser)

  return (
    <div
      className={[
        'relative flex items-center gap-4 overflow-hidden rounded-[26px] border px-6 py-5',
        isCurrentUser
          ? 'border-[#7b6842] bg-[#08251b]'
          : 'border-border bg-surface/82',
      ].join(' ')}
    >
      {isCurrentUser ? <div className="absolute inset-y-0 left-0 w-2 rounded-l-[26px] bg-accent" /> : null}
      <div className={['w-16 text-5xl font-semibold', isCurrentUser ? 'text-accent' : 'text-muted/35'].join(' ')}>
        {String(row.position).padStart(2, '0')}
      </div>
      <div
        className={[
          'flex h-[72px] w-[72px] items-center justify-center rounded-2xl border p-2',
          isCurrentUser ? 'border-[#8b7449] bg-[#0d3427]' : 'border-border bg-primary-light/80',
        ].join(' ')}
      >
        <Avatar name={row.display_name} color={row.avatar_color} className="h-12 w-12 text-base" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={['truncate text-2xl font-semibold', isCurrentUser ? 'text-accent' : 'text-ink'].join(' ')}>
          {isCurrentUser ? `You (${row.display_name})` : row.display_name}
        </p>
        <p className={['truncate text-base', isCurrentUser ? 'text-accent-dark/90' : 'text-muted'].join(' ')}>{subtitle}</p>
      </div>
      <div className="text-right">
        <p className={['font-display text-5xl uppercase', isCurrentUser ? 'text-accent' : 'text-ink'].join(' ')}>
          {row.total_points.toLocaleString('en-US')}
        </p>
        <p className={['mt-1 text-lg font-semibold', isCurrentUser ? 'text-accent' : 'text-muted'].join(' ')}>
          {isCurrentUser ? 'Stable' : `${row.correct_results} aciertos`}
        </p>
      </div>
    </div>
  )
}

export default function RankingTable({ rows, currentUserId }) {
  const topThree = rows.slice(0, 3)
  const restRows = rows.slice(3)
  const featured = topThree[0]
  const left = topThree[1]
  const right = topThree[2]

  return (
    <div className="space-y-8">
      {featured ? (
        <div className="px-2 pt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:items-end">
            {left ? <PodiumCard row={left} rank={2} /> : <div />}
            <PodiumCard row={featured} rank={1} featured />
            {right ? <PodiumCard row={right} rank={3} /> : <div />}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">Global Rankings</p>
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
