import Badge from '../ui/Badge'

const tabs = [
  { key: 'live', label: 'En vivo' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Anteriores' },
]

export default function MatchTabs({ activeTab, counts, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={[
            'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
            activeTab === tab.key
              ? 'border-accent bg-accent text-primary'
              : 'border-border bg-surface/75 text-muted hover:border-accent/50 hover:text-ink',
          ].join(' ')}
        >
          {tab.label}
          {tab.key === 'live' && counts.live > 0 ? (
            <Badge tone="live" pulse>
              {counts.live}
            </Badge>
          ) : (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs text-ink/85">
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
