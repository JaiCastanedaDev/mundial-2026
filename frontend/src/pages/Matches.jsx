import { useMemo, useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'
import MatchCard from '../components/matches/MatchCard'
import MatchTabs from '../components/matches/MatchTabs'
import MyPerformancePanel from '../components/matches/MyPerformancePanel'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useMatches, useSavePrediction } from '../hooks/useMatches'
import { buildPerformanceSummary } from '../hooks/usePredictions'
import { useRanking } from '../hooks/useRanking'

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
  const { profile } = useAuth()
  const { data: matches = [], isLoading, error } = useMatches()
  const { data: ranking = [] } = useRanking()
  const savePrediction = useSavePrediction()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [finishedStageFilter, setFinishedStageFilter] = useState('all')

  const byStatus = useMemo(
    () => ({
      live: matches.filter((match) => match.status === 'live'),
      upcoming: matches.filter((match) => match.status === 'scheduled'),
      finished: matches.filter((match) => match.status === 'finished').sort((a, b) => new Date(b.match_date) - new Date(a.match_date)),
    }),
    [matches],
  )

  const filteredFinished = useMemo(() => {
    if (finishedStageFilter === 'all') return byStatus.finished
    return byStatus.finished.filter((match) => match.stage === finishedStageFilter)
  }, [byStatus.finished, finishedStageFilter])

  const visibleMatches =
    activeTab === 'live' ? byStatus.live : activeTab === 'finished' ? filteredFinished : byStatus.upcoming

  const groupedUpcoming = useMemo(() => Object.values(groupMatches(byStatus.upcoming)), [byStatus.upcoming])
  const performance = useMemo(
    () => buildPerformanceSummary(matches, profile?.id),
    [matches, profile?.id],
  )
  const rankingEntry = ranking.find((entry) => entry.id === profile?.id)
  const finishedStages = [...new Set(byStatus.finished.map((match) => match.stage))]

  async function handleSavePrediction(matchId, homeScore, awayScore) {
    await savePrediction.mutateAsync({
      matchId,
      userId: profile.id,
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
                      currentUserId={profile?.id}
                      isSaving={savePrediction.isPending}
                      onSavePrediction={handleSavePrediction}
                    />
                  ))}
                </div>
              ))
            : visibleMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  currentUserId={profile?.id}
                  isSaving={savePrediction.isPending}
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
