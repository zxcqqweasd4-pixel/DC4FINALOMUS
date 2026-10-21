import { Navigate, Outlet } from 'react-router-dom'
import Spinner from './Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'

function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner label="Restoring your session..." />
  }

  return user ? <Navigate to="/" replace /> : <Outlet />
}

export default PublicRoute
