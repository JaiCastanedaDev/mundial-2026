import RankingTable from '../components/ranking/RankingTable'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useRanking } from '../hooks/useRanking'

export default function Ranking() {
  const { profile } = useAuth()
  const { data = [], isLoading, error } = useRanking()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Cargando ranking" />
      </div>
    )
  }

  if (error) {
    return <div className="panel p-6 text-[#ff9f92]">No se pudo cargar el ranking: {error.message}</div>
  }

  return (
    <section className="space-y-8 pb-6">
      <div>
        <h1 className="font-display text-5xl tracking-normal text-ink sm:text-7xl">World Rankings</h1>
        <p className="mt-4 max-w-xl text-2xl leading-tight text-muted">
          Top predictors from across the tournament. See who is setting the pace and how your picks stack up.
        </p>
      </div>
      <RankingTable rows={data} currentUserId={profile?.id} />
    </section>
  )
}
