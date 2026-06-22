import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, LoaderCircle, Lock, Pencil } from 'lucide-react'
import { getPredictionHelperText, isPredictionClosed } from '../../lib/scoring'

function clampScore(value) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return ''
  return Math.min(parsed, 99)
}

function normalizeScoreValue(value) {
  return value === '' || value === null || value === undefined ? '' : String(value)
}

function adjustScore(currentValue, delta) {
  const baseValue = currentValue === '' ? 0 : Number(currentValue)
  return clampScore(String(baseValue + delta))
}

function ScoreStepper({ value, onChange, disabled, teamName }) {
  return (
    <div className="flex items-center rounded-2xl border border-border bg-primary-light/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <button
        type="button"
        onClick={() => onChange(adjustScore(value, -1))}
        disabled={disabled || value === '' || Number(value) <= 0}
        aria-label={`Bajar gol de ${teamName}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-primary text-xl font-semibold text-accent transition hover:border-accent/35 hover:bg-[#082b20] disabled:cursor-not-allowed disabled:text-muted/40"
      >
        -
      </button>
      <input
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={(event) => onChange(clampScore(event.target.value))}
        disabled={disabled}
        className="w-16 bg-transparent px-2 py-2 text-center text-2xl font-semibold text-ink outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(adjustScore(value, 1))}
        disabled={disabled || Number(value) >= 99}
        aria-label={`Subir gol de ${teamName}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-accent/14 text-xl font-semibold text-accent transition hover:border-accent/35 hover:bg-accent/20 disabled:cursor-not-allowed disabled:text-muted/40"
      >
        +
      </button>
    </div>
  )
}

export default function PredictionInput({ match, prediction, onSave, isSaving, groupStageDeadline, saveState }) {
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home_score ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away_score ?? '')
  const [isEditing, setIsEditing] = useState(!prediction)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const closed = isPredictionClosed(match, groupStageDeadline)
  const hasChanges =
    normalizeScoreValue(homeScore) !== normalizeScoreValue(prediction?.predicted_home_score) ||
    normalizeScoreValue(awayScore) !== normalizeScoreValue(prediction?.predicted_away_score)

  useEffect(() => {
    setHomeScore(prediction?.predicted_home_score ?? '')
    setAwayScore(prediction?.predicted_away_score ?? '')
    setIsEditing(!prediction)
    setIsSubmitting(false)
    setCountdown(null)
  }, [prediction?.predicted_away_score, prediction?.predicted_home_score])

  const submitPrediction = useCallback(async () => {
    if (closed || isSubmitting || homeScore === '' || awayScore === '' || !hasChanges) return

    try {
      setIsSubmitting(true)
      await onSave(Number(homeScore), Number(awayScore))
      setIsEditing(false)
      setCountdown(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [awayScore, closed, hasChanges, homeScore, isSubmitting, onSave])

  useEffect(() => {
    if (!isEditing || closed || isSubmitting || homeScore === '' || awayScore === '' || !hasChanges) {
      setCountdown(null)
      return
    }

    setCountdown(3)
    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      const nextCountdown = Math.max(0, 3 - elapsedSeconds)

      setCountdown(nextCountdown)

      if (nextCountdown === 0) {
        window.clearInterval(intervalId)
        void submitPrediction()
      }
    }, 200)

    return () => window.clearInterval(intervalId)
  }, [awayScore, closed, hasChanges, homeScore, isEditing, isSubmitting, submitPrediction])

  const helperText = useMemo(() => {
    if (!hasChanges && prediction) return 'No hay cambios pendientes por guardar.'
    if (homeScore === '' || awayScore === '') return 'Define ambos marcadores.'
    if (Number(homeScore) === Number(awayScore)) return 'Vista previa: empate.'
    return Number(homeScore) > Number(awayScore)
      ? `Vista previa: gana ${match.home_team}.`
      : `Vista previa: gana ${match.away_team}.`
  }, [awayScore, hasChanges, homeScore, match.away_team, match.home_team, prediction])

  if (!isEditing && prediction) {
    return (
      <div className="mt-4 rounded-2xl border border-[#7b6842] bg-[#08251b] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#9b8052] bg-accent/12 text-accent">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent">Pronóstico guardado</p>
              <p className="text-sm text-accent-dark">
                {prediction.predicted_home_score} - {prediction.predicted_away_score}
              </p>
            </div>
          </div>

          {!closed ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-primary-light px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/35 hover:text-accent"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-muted">
          {closed ? getPredictionHelperText(match, groupStageDeadline) : 'Puedes editarlo cuando quieras.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface/70 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScoreStepper value={homeScore} onChange={setHomeScore} disabled={closed || isSaving} teamName={match.home_team} />
        <span className="font-display text-3xl text-accent-dark">-</span>
        <ScoreStepper value={awayScore} onChange={setAwayScore} disabled={closed || isSaving} teamName={match.away_team} />
        <div className="ml-auto flex min-w-[180px] justify-end">
          {isSubmitting || isSaving ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-primary-light px-4 py-3 text-sm font-semibold text-ink">
              <LoaderCircle className="h-4 w-4 animate-spin text-accent" />
              Guardando...
            </div>
          ) : saveState === 'success' && !hasChanges ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#7b6842] bg-[#08251b] px-4 py-3 text-sm font-semibold text-accent">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </div>
          ) : countdown !== null && hasChanges ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#9b8052] bg-accent px-4 py-3 text-sm font-semibold text-primary">
              Auto guardado en {countdown}s
            </div>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {closed ? getPredictionHelperText(match, groupStageDeadline) : helperText}
      </p>
    </div>
  )
}
