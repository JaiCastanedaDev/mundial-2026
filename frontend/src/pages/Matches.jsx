import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Filter, X, XCircle } from 'lucide-react'
import MatchCard from '../components/matches/MatchCard'
import MatchTabs from '../components/matches/MatchTabs'
import MyPerformancePanel from '../components/matches/MyPerformancePanel'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useAppSettings } from '../hooks/useAppSettings'
import { useMatches, useSavePrediction } from '../hooks/useMatches'
import { buildPerformanceSummary, categorizeFinishedMatches, countMissingGroupStagePredictions } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'
import { isGroupStageMatch, isPredictionClosed, parsePredictionDeadline } from '../lib/scoring'

const WORLD_CUP_2026_START = new Date('2026-06-11T00:00:00Z')
const WORLD_CUP_2026_END = new Date('2026-07-20T00:00:00Z')

function isWorldCupMatch(match) {
  const matchDate = new Date(match.match_date)
  const hasValidDate = !Number.isNaN(matchDate.getTime())

  return hasValidDate && matchDate >= WORLD_CUP_2026_START && matchDate < WORLD_CUP_2026_END
}

function getMatchTimestamp(match) {
  return new Date(match.match_date).getTime()
}

function compareMatchesByDateAsc(a, b) {
  return getMatchTimestamp(a) - getMatchTimestamp(b)
}

function compareMatchesByDateDesc(a, b) {
  return getMatchTimestamp(b) - getMatchTimestamp(a)
}

function groupMatches(matches) {
  const groupedMatches = matches.reduce((acc, match) => {
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

  return Object.values(groupedMatches)
    .map((group) => ({
      ...group,
      items: [...group.items].sort(compareMatchesByDateAsc),
    }))
    .sort((a, b) => compareMatchesByDateAsc(a.items[0], b.items[0]))
}

export default function Matches() {
  const { profile, session } = useAuth()
  const { data: matches = [], isLoading, error } = useMatches()
  const { data: appSettings = {} } = useAppSettings()
  const { data: ranking = [] } = useRanking()
  const savePrediction = useSavePrediction()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [finishedStageFilter, setFinishedStageFilter] = useState('all')
  const [performanceFilter, setPerformanceFilter] = useState(null)
  const [saveFeedback, setSaveFeedback] = useState(null)
  const matchesListRef = useRef(null)
  const worldCupMatches = useMemo(() => matches.filter(isWorldCupMatch), [matches])
  const currentUserId = session?.user?.id ?? profile?.id ?? null
  const groupStageDeadline = useMemo(
    () => parsePredictionDeadline(appSettings.group_stage_prediction_deadline),
    [appSettings.group_stage_prediction_deadline],
  )

  const byStatus = useMemo(
    () => ({
      live: worldCupMatches.filter((match) => match.status === 'live').sort(compareMatchesByDateAsc),
      upcoming: worldCupMatches
        .filter((match) => !isPredictionClosed(match, groupStageDeadline))
        .sort(compareMatchesByDateAsc),
      finished: worldCupMatches
        .filter((match) => match.status === 'finished')
        .sort(compareMatchesByDateDesc),
    }),
    [groupStageDeadline, worldCupMatches],
  )

  const finishedBuckets = useMemo(
    () => categorizeFinishedMatches(worldCupMatches, currentUserId),
    [currentUserId, worldCupMatches],
  )

  const filteredFinished = useMemo(() => {
    const stageFiltered =
      finishedStageFilter === 'all'
        ? byStatus.finished
        : byStatus.finished.filter((match) => match.stage === finishedStageFilter)

    if (!performanceFilter) return stageFiltered

    const allowedIds = new Set((finishedBuckets[performanceFilter] ?? []).map((match) => match.id))
    return stageFiltered.filter((match) => allowedIds.has(match.id))
  }, [byStatus.finished, finishedBuckets, finishedStageFilter, performanceFilter])

  const visibleMatches =
    activeTab === 'live' ? byStatus.live : activeTab === 'finished' ? filteredFinished : byStatus.upcoming

  const groupedUpcoming = useMemo(() => groupMatches(byStatus.upcoming), [byStatus.upcoming])
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

  useEffect(() => {
    if (!saveFeedback) return

    const timeoutId = window.setTimeout(() => setSaveFeedback(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [saveFeedback])

  useEffect(() => {
    if (activeTab !== 'finished' && performanceFilter) {
      setPerformanceFilter(null)
    }
  }, [activeTab, performanceFilter])

  useEffect(() => {
    if (!performanceFilter) return

    const timeoutId = window.setTimeout(() => {
      matchesListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [performanceFilter])

  function handleSelectPerformanceFilter(filterKey) {
    setActiveTab('finished')
    setPerformanceFilter((current) => (current === filterKey ? null : filterKey))
  }

  async function handleSavePrediction(matchId, homeScore, awayScore) {
    if (!currentUserId) {
      throw new Error('Tu sesión todavía no está lista. Recarga la página e inténtalo de nuevo.')
    }

    const match = worldCupMatches.find((item) => item.id === matchId)

    try {
      await savePrediction.mutateAsync({
        matchId,
        userId: currentUserId,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
      })

      setSaveFeedback({
        tone: 'success',
        matchId,
        message: `Prediccion guardada para ${match?.home_team ?? 'el partido'} vs ${match?.away_team ?? ''}.`,
      })
    } catch (saveError) {
      setSaveFeedback({
        tone: 'error',
        matchId,
        message: saveError instanceof Error ? saveError.message : 'No se pudo guardar la prediccion.',
      })
      throw saveError
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Cargando partidos" />
      </div>
    )
  }

  if (error) {
    return <div className="panel p-6 text-[#ff9f92]">No se pudieron cargar los partidos: {error.message}</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Panel principal</p>
            <h1 className="section-title">Partidos</h1>
          </div>
        </div>

        {groupStageDeadline && new Date() < groupStageDeadline ? (
          <div className="mb-6 rounded-xl border border-[#6a5530] bg-[#3a2d14] px-4 py-3 text-sm text-accent">
            Te faltan {missingGroupStagePredictions} predicciones de fase de grupos. Debes completarlas antes del{' '}
            {groupStageDeadline.toLocaleString('es-CO')}.
          </div>
        ) : null}

        {saveFeedback ? (
          <div
            className={[
              'mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
              saveFeedback.tone === 'success'
                ? 'border-[#2f5c46] bg-[#173327] text-[#9be1b5]'
                : 'border-[#6f2e28] bg-[#3c1714] text-[#ff9b8d]',
            ].join(' ')}
          >
            {saveFeedback.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{saveFeedback.message}</p>
          </div>
        ) : null}

        <MyPerformancePanel
          className="mb-6 lg:hidden"
          rankingEntry={rankingEntry}
          summary={performance}
          activeFilter={performanceFilter}
          onSelectFilter={handleSelectPerformanceFilter}
        />

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {performanceFilter ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7449] bg-primary-light/80 px-4 py-2 text-sm text-accent">
                Viendo:{' '}
                <span className="font-semibold">
                  {{
                    exact: 'marcadores exactos',
                    correct: 'resultados correctos',
                    wrong: 'fallados',
                    missed: 'no predichos',
                  }[performanceFilter]}
                </span>
                <button
                  type="button"
                  onClick={() => setPerformanceFilter(null)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-accent-dark transition hover:text-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : <div />}

            <label className="flex items-center gap-2 rounded-full border border-border bg-surface/75 px-4 py-2 text-sm text-ink">
              <Filter className="h-4 w-4 text-muted" />
              <select
                className="bg-transparent pr-6 text-ink outline-none"
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
              <ChevronDown className="h-4 w-4 text-muted" />
            </label>
          </div>
        ) : null}

        <div ref={matchesListRef} className="space-y-4">
          {activeTab === 'upcoming'
            ? groupedUpcoming.map((group) => (
                <div key={group.label} className="space-y-4">
                  <h2 className="font-display text-2xl uppercase text-accent">{group.label}</h2>
                  {group.items.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      currentUserId={currentUserId}
                      isSaving={savePrediction.isPending}
                      groupStageDeadline={groupStageDeadline}
                      saveState={saveFeedback?.tone === 'success' && saveFeedback.matchId === match.id ? 'success' : 'idle'}
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
                  saveState={saveFeedback?.tone === 'success' && saveFeedback.matchId === match.id ? 'success' : 'idle'}
                  onSavePrediction={handleSavePrediction}
                />
              ))}

          {visibleMatches.length === 0 ? (
            <div className="panel p-8 text-center text-muted">No hay partidos para esta vista.</div>
          ) : null}
        </div>
      </section>

      <MyPerformancePanel
        className="hidden lg:block"
        rankingEntry={rankingEntry}
        summary={performance}
        activeFilter={performanceFilter}
        onSelectFilter={handleSelectPerformanceFilter}
      />
    </div>
  )
}
