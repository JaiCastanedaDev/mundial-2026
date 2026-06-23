import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Spinner from './components/ui/Spinner'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Profile from './pages/Profile'
import Ranking from './pages/Ranking'
import Rules from './pages/Rules'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Cargando sesión" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/partidos" replace />} />
        <Route path="/partidos" element={<Matches />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/perfil/:username" element={<Profile />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/reglas" element={<Rules />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
