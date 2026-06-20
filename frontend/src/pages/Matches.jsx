import { useMemo, useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'
import MatchCard from '../components/matches/MatchCard'
import MatchTabs from '../components/matches/MatchTabs'
import MyPerformancePanel from '../components/matches/MyPerformancePanel'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useAppSettings } from '../hooks/useAppSettings'
import { useMatches, useSavePrediction } from '../hooks/useMatches'
import { buildPerformanceSummary, countMissingGroupStagePredictions } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'
import { isGroupStageMatch, isPredictionClosed, parsePredictionDeadline } from '../lib/scoring'

const WORLD_CUP_2026_START = new Date('2026-06-11T00:00:00Z')
const WORLD_CUP_2026_END = new Date('2026-07-20T00:00:00Z')

function isWorldCupMatch(match) {
  const matchDate = new Date(match.match_date)
  const hasValidDate = !Number.isNaN(matchDate.getTime())

  return hasValidDate && matchDate >= WORLD_CUP_2026_START && matchDate < WORLD_CUP_2026_END
}

function groupMatches(matches) {
  return matches.reduce((acc, match) => {
    const dayKey = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(match.match_date))

    const groupKey = `${match.stage}__${dayKey}`
    acc[groupKey] ??= { label: `${match.stage} · ${dayKey}`, items: [] }
    acc[groupKey].items.push(match)
    return acc
  }, {})
}

export default function Matches() {
  const { profile, session } = useAuth()
  const { data: matches = [], isLoading, error } = useMatches()
  const { data: appSettings = {} } = useAppSettings()
  const { data: ranking = [] } = useRanking()
  const savePrediction = useSavePrediction()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [finishedStageFilter, setFinishedStageFilter] = useState('all')
  const worldCupMatches = useMemo(() => matches.filter(isWorldCupMatch), [matches])
  const currentUserId = session?.user?.id ?? profile?.id ?? null
  const groupStageDeadline = useMemo(
    () => parsePredictionDeadline(appSettings.group_stage_prediction_deadline),
    [appSettings.group_stage_prediction_deadline],
  )

  const byStatus = useMemo(
    () => ({
      live: worldCupMatches.filter((match) => match.status === 'live'),
      upcoming: worldCupMatches.filter((match) => !isPredictionClosed(match, groupStageDeadline)),
      finished: worldCupMatches
        .filter((match) => match.status === 'finished')
        .sort((a, b) => new Date(b.match_date) - new Date(a.match_date)),
    }),
    [groupStageDeadline, worldCupMatches],
  )

  const filteredFinished = useMemo(() => {
    if (finishedStageFilter === 'all') return byStatus.finished
    return byStatus.finished.filter((match) => match.stage === finishedStageFilter)
  }, [byStatus.finished, finishedStageFilter])

  const visibleMatches =
    activeTab === 'live' ? byStatus.live : activeTab === 'finished' ? filteredFinished : byStatus.upcoming

  const groupedUpcoming = useMemo(() => Object.values(groupMatches(byStatus.upcoming)), [byStatus.upcoming])
  const performance = useMemo(
    () => buildPerformanceSummary(worldCupMatches, currentUserId),
    [currentUserId, worldCupMatches],
  )
  const rankingEntry = ranking.find((entry) => entry.id === profile?.id)
  const finishedStages = [...new Set(byStatus.finished.map((match) => match.stage))]
  const missingGroupStagePredictions = useMemo(
    () => countMissingGroupStagePredictions(worldCupMatches.filter(isGroupStageMatch), currentUserId),
    [currentUserId, worldCupMatches],
  )

  async function handleSavePrediction(matchId, homeScore, awayScore) {
    if (!currentUserId) {
      throw new Error('Tu sesión todavía no está lista. Recarga la página e inténtalo de nuevo.')
    }

    await savePrediction.mutateAsync({
      matchId,
      userId: currentUserId,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Cargando partidos" />
      </div>
    )
  }

  if (error) {
    return <div className="panel p-6 text-red-600">No se pudieron cargar los partidos: {error.message}</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Panel principal</p>
            <h1 className="section-title">Partidos</h1>
          </div>
        </div>

        {groupStageDeadline && new Date() < groupStageDeadline ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Te faltan {missingGroupStagePredictions} predicciones de fase de grupos. Debes completarlas antes del{' '}
            {groupStageDeadline.toLocaleString('es-CO')}.
          </div>
        ) : null}

        <MatchTabs
          activeTab={activeTab}
          counts={{
            live: byStatus.live.length,
            upcoming: byStatus.upcoming.length,
            finished: byStatus.finished.length,
          }}
          onChange={setActiveTab}
        />

        {activeTab === 'finished' ? (
          <div className="mb-4 flex items-center justify-end">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                className="bg-transparent pr-6 text-slate-700 outline-none"
                value={finishedStageFilter}
                onChange={(event) => setFinishedStageFilter(event.target.value)}
              >
                <option value="all">Todas las fases</option>
                {finishedStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </label>
          </div>
        ) : null}

        <div className="space-y-4">
          {activeTab === 'upcoming'
            ? groupedUpcoming.map((group) => (
                <div key={group.label} className="space-y-4">
                  <h2 className="font-display text-2xl uppercase text-slate-800">{group.label}</h2>
                  {group.items.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      currentUserId={currentUserId}
                      isSaving={savePrediction.isPending}
                      groupStageDeadline={groupStageDeadline}
                      onSavePrediction={handleSavePrediction}
                    />
                  ))}
                </div>
              ))
            : visibleMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={currentUserId}
                  isSaving={savePrediction.isPending}
                  groupStageDeadline={groupStageDeadline}
                  onSavePrediction={handleSavePrediction}
                />
              ))}

          {visibleMatches.length === 0 ? (
            <div className="panel p-8 text-center text-slate-500">No hay partidos para esta vista.</div>
          ) : null}
        </div>
      </section>

      <MyPerformancePanel rankingEntry={rankingEntry} summary={performance} />
    </div>
  )
}
