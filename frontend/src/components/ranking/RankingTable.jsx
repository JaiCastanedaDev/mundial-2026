import { Medal } from 'lucide-react'

function Avatar({ name, color }) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map((value) => value[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}

function PositionCell({ position }) {
  const medalTone =
    position === 1 ? 'text-accent' : position === 2 ? 'text-[#b7c3bc]' : position === 3 ? 'text-[#b58a57]' : 'text-muted'

  return (
    <div className="flex items-center gap-2 font-semibold">
      {position <= 3 ? <Medal className={['h-4 w-4', medalTone].join(' ')} /> : null}
      <span>#{position}</span>
    </div>
  )
}

export default function RankingTable({ rows, currentUserId }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-primary-light text-left text-muted">
            <tr>
              <th className="px-4 py-4 font-medium">Pos.</th>
              <th className="px-4 py-4 font-medium">Jugador</th>
              <th className="px-4 py-4 font-medium">Puntos</th>
              <th className="px-4 py-4 font-medium">Exactos</th>
              <th className="px-4 py-4 font-medium">Correctos</th>
              <th className="px-4 py-4 font-medium">Predicciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  'border-t border-border',
                  row.id === currentUserId ? 'bg-[#0f2e22]' : 'bg-surface/45',
                ].join(' ')}
              >
                <td className="px-4 py-4">
                  <PositionCell position={row.position} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.display_name} color={row.avatar_color} />
                    <div>
                      <p className="font-semibold text-ink">{row.display_name}</p>
                      <p className="text-xs text-muted">@{row.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-display text-3xl uppercase text-accent">{row.total_points}</td>
                <td className="px-4 py-4">{row.exact_scores}</td>
                <td className="px-4 py-4">{row.correct_results}</td>
                <td className="px-4 py-4">
                  {row.total_predicted} / {row.total_predicted + row.total_missed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
