const STAGE_LABELS = {
  'Group Stage': 'Fase de grupos',
  'Round of 32': 'Dieciseisavos',
  'Round of 16': 'Octavos',
  'Quarter-finals': 'Cuartos de final',
  'Semi-finals': 'Semifinales',
  'Third Place': 'Tercer puesto',
  Final: 'Final',
}

const STATUS_LABELS = {
  scheduled: 'Programado',
  live: 'En vivo',
  finished: 'Finalizado',
}

export function translateStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage ?? ''
}

export function translateMatchStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? ''
}
