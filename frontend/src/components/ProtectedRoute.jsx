import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from './Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner label="Restoring your session..." />
  }

  return user
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}

export default ProtectedRoute
