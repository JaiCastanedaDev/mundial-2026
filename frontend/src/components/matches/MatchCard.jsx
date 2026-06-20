import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../ui/Badge'
import PredictionInput from './PredictionInput'
import { getUserPrediction } from '../../hooks/usePredictions'
import { isPredictionClosed } from '../../lib/scoring'

function formatResultLabel(match, prediction) {
  if (!prediction) return { tone: 'default', text: 'No predicho' }
  if (!prediction.is_calculated) return { tone: 'default', text: 'Pendiente de cálculo' }
  if (prediction.points_earned <= 0) return { tone: 'default', text: '0 pts' }

  const exact =
    prediction.predicted_home_score === (match.home_score_ft ?? match.home_score) &&
    prediction.predicted_away_score === (match.away_score_ft ?? match.away_score)

  return exact
    ? { tone: 'success', text: `Exacto +${prediction.points_earned} pts` }
    : { tone: 'warning', text: `Correcto +${prediction.points_earned} pts` }
}

export default function MatchCard({ match, currentUserId, onSavePrediction, isSaving, groupStageDeadline, saveState }) {
  const userPrediction = getUserPrediction(match, currentUserId)
  const resultLabel = formatResultLabel(match, userPrediction)
  const formattedDate = format(new Date(match.match_date), "d MMM yyyy, HH:mm", { locale: es })
  const canEditPrediction = Boolean(currentUserId) && !isPredictionClosed(match, groupStageDeadline)

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {match.status === 'live' ? (
            <Badge tone="live" pulse>
              En vivo
            </Badge>
          ) : null}
          {match.status === 'finished' ? <Badge tone="success">Finalizado</Badge> : null}
          <Badge tone="default">{match.stage}</Badge>
          {match.group_name ? <Badge tone="default">Grupo {match.group_name}</Badge> : null}
        </div>
        <p className="text-sm text-slate-500">{formattedDate}</p>
      </div>

      <div className="grid gap-4 py-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex items-center gap-3">
          {match.home_team_logo ? (
            <img src={match.home_team_logo} alt={match.home_team} className="h-10 w-10 rounded-full bg-slate-100 object-contain p-1" />
          ) : null}
          <div>
            <p className="text-lg font-semibold">{match.home_team}</p>
            <p className="text-sm text-slate-500">Local</p>
          </div>
        </div>

        <div className="text-center">
          <div className="font-display text-5xl uppercase text-primary">
            {match.status === 'scheduled' ? (
              <>
                <span className="text-slate-400">vs</span>
              </>
            ) : (
              <>
                <span>{match.home_score_ft ?? match.home_score ?? 0}</span>
                <span className="mx-3 text-slate-400">-</span>
                <span>{match.away_score_ft ?? match.away_score ?? 0}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">{match.venue ?? 'Sede por confirmar'}</p>
        </div>

        <div className="flex items-center justify-end gap-3 text-right">
          <div>
            <p className="text-lg font-semibold">{match.away_team}</p>
            <p className="text-sm text-slate-500">Visitante</p>
          </div>
          {match.away_team_logo ? (
            <img src={match.away_team_logo} alt={match.away_team} className="h-10 w-10 rounded-full bg-slate-100 object-contain p-1" />
          ) : null}
        </div>
      </div>

      {canEditPrediction ? (
        <>
          <PredictionInput
            match={match}
            prediction={userPrediction}
            isSaving={isSaving}
            groupStageDeadline={groupStageDeadline}
            saveState={saveState}
            onSave={(homeScore, awayScore) => onSavePrediction(match.id, homeScore, awayScore)}
          />
          <p className="mt-3 text-sm text-slate-500">
            {userPrediction
              ? `Predicción guardada: ${userPrediction.predicted_home_score}-${userPrediction.predicted_away_score}`
              : 'Aún no has enviado predicción para este partido.'}
          </p>
        </>
      ) : null}

      {match.status === 'live' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {userPrediction
              ? `Tu predicción: ${userPrediction.predicted_home_score}-${userPrediction.predicted_away_score}`
              : 'No predijiste este partido.'}
          </p>
          <Badge tone="live" pulse>
            Marcador en actualización
          </Badge>
        </div>
      ) : null}

      {match.status === 'finished' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            {userPrediction
              ? `Tu predicción: ${userPrediction.predicted_home_score}-${userPrediction.predicted_away_score}`
              : 'No registraste predicción para este partido.'}
          </p>
          <Badge tone={resultLabel.tone}>{resultLabel.text}</Badge>
        </div>
      ) : null}
    </article>
  )
}
