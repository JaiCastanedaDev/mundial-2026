import { Target, Trophy, CircleCheck, CircleX, SkipForward } from 'lucide-react'

function Stat({ icon: Icon, label, value, tone, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg border bg-primary-light/70 p-4 text-left transition',
        isActive ? 'border-accent shadow-[inset_3px_0_0_0_#f4cf8b]' : 'border-border hover:border-accent/35',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className={['h-4 w-4', tone].join(' ')} />
        {label}
      </div>
      <p className="mt-2 font-display text-3xl uppercase text-ink">{value}</p>
    </button>
  )
}

export default function MyPerformancePanel({ rankingEntry, summary, activeFilter, onSelectFilter }) {
  const attempts = summary.exact + summary.correct + summary.wrong
  const precision = attempts > 0 ? ((summary.exact + summary.correct) / attempts) * 100 : 0

  return (
    <aside className="panel p-5 lg:sticky lg:top-6">
      <div className="border-b border-border pb-4">
        <p className="text-sm text-muted">Tu torneo</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="font-display text-4xl uppercase text-accent">#{rankingEntry?.position ?? '-'}</p>
            <p className="text-sm text-muted">Posición actual</p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl uppercase text-accent-dark">
              {rankingEntry?.total_points ?? 0}
            </p>
            <p className="text-sm text-muted">Puntos</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <Stat
          icon={CircleCheck}
          label="Marcadores exactos"
          value={summary.exact}
          tone="text-success"
          isActive={activeFilter === 'exact'}
          onClick={() => onSelectFilter('exact')}
        />
        <Stat
          icon={Target}
          label="Resultado correcto"
          value={summary.correct}
          tone="text-accent"
          isActive={activeFilter === 'correct'}
          onClick={() => onSelectFilter('correct')}
        />
        <Stat
          icon={CircleX}
          label="Fallados"
          value={summary.wrong}
          tone="text-live"
          isActive={activeFilter === 'wrong'}
          onClick={() => onSelectFilter('wrong')}
        />
        <Stat
          icon={SkipForward}
          label="No predichos"
          value={summary.missed}
          tone="text-muted"
          isActive={activeFilter === 'missed'}
          onClick={() => onSelectFilter('missed')}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-primary px-4 py-4 text-ink">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Trophy className="h-4 w-4" />
          Precisión
        </div>
        <p className="mt-2 font-display text-4xl uppercase text-accent">{precision.toFixed(1)}%</p>
      </div>
    </aside>
  )
}
