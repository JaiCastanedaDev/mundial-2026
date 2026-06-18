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
    return <div className="panel p-6 text-red-600">No se pudo cargar el ranking: {error.message}</div>
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Clasificación general</p>
        <h1 className="section-title">Ranking</h1>
      </div>
      <RankingTable rows={data} currentUserId={profile?.id} />
    </section>
  )
}
