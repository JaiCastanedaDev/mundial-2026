const phases = [
  ['Fase de grupos', '3 pts exacto', '1 pt resultado correcto'],
  ['Dieciseisavos', '4 pts exacto', '2 pts resultado correcto'],
  ['Octavos', '4 pts exacto', '2 pts resultado correcto'],
  ['Cuartos', '5 pts exacto', '3 pts resultado correcto'],
  ['Semifinales', '5 pts exacto', '4 pts resultado correcto'],
  ['Tercer puesto', '4 pts exacto', '2 pts resultado correcto'],
  ['Final', '5 pts exacto', '5 pts resultado correcto'],
]

const examples = [
  {
    title: 'Exacto',
    body: 'Pronóstico 2-1, resultado real 2-1. Se otorgan solo los puntos exactos de la fase.',
  },
  {
    title: 'Correcto',
    body: 'Pronóstico 3-1, resultado real 1-0. Acertaste el ganador, no el marcador.',
  },
  {
    title: 'Fallado',
    body: 'Pronóstico 0-2, resultado real 1-1. No sumas puntos.',
  },
]

export default function Rules() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Sistema de juego</p>
        <h1 className="section-title">Reglas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phases.map(([phase, exact, correct]) => (
          <article key={phase} className="panel p-5">
            <h2 className="font-display text-2xl uppercase text-primary">{phase}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-md bg-green-50 px-3 py-2 text-green-700">{exact}</p>
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">{correct}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-2xl uppercase text-primary">Desempates</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Mayor cantidad de marcadores exactos.</li>
          <li>Mayor cantidad de resultados correctos.</li>
          <li>Si persiste, la posición queda empatada.</li>
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {examples.map((example) => (
          <article key={example.title} className="panel p-5">
            <h2 className="font-display text-2xl uppercase text-slate-900">{example.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{example.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
