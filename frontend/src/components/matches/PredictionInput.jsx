import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react'
import { getPredictionHelperText, isPredictionClosed } from '../../lib/scoring'

function clampScore(value) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return ''
  return Math.min(parsed, 99)
}

export default function PredictionInput({ match, prediction, onSave, isSaving, groupStageDeadline, saveState }) {
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home_score ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away_score ?? '')
  const closed = isPredictionClosed(match, groupStageDeadline)
  const hasChanges =
    Number(homeScore) !== Number(prediction?.predicted_home_score ?? '') ||
    Number(awayScore) !== Number(prediction?.predicted_away_score ?? '')

  useEffect(() => {
    setHomeScore(prediction?.predicted_home_score ?? '')
    setAwayScore(prediction?.predicted_away_score ?? '')
  }, [prediction?.predicted_away_score, prediction?.predicted_home_score])

  const helperText = useMemo(() => {
    if (!hasChanges && prediction) return 'No hay cambios pendientes por guardar.'
    if (homeScore === '' || awayScore === '') return 'Define ambos marcadores.'
    if (Number(homeScore) === Number(awayScore)) return 'Vista previa: empate.'
    return Number(homeScore) > Number(awayScore)
      ? `Vista previa: gana ${match.home_team}.`
      : `Vista previa: gana ${match.away_team}.`
  }, [awayScore, hasChanges, homeScore, match.away_team, match.home_team, prediction])

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          max="99"
          value={homeScore}
          onChange={(event) => setHomeScore(clampScore(event.target.value))}
          disabled={closed || isSaving}
          className="w-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xl font-semibold"
        />
        <span className="font-display text-3xl text-slate-500">-</span>
        <input
          type="number"
          min="0"
          max="99"
          value={awayScore}
          onChange={(event) => setAwayScore(clampScore(event.target.value))}
          disabled={closed || isSaving}
          className="w-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xl font-semibold"
        />
        <button
          type="button"
          onClick={() => {
            void onSave(Number(homeScore), Number(awayScore)).catch(() => {})
          }}
          disabled={closed || isSaving || homeScore === '' || awayScore === '' || !hasChanges}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : saveState === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? 'Guardando...' : saveState === 'success' ? 'Guardado' : 'Guardar'}
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {closed ? getPredictionHelperText(match, groupStageDeadline) : helperText}
      </p>
    </div>
  )
}
