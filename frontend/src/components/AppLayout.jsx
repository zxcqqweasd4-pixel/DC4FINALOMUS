import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from './Navbar.jsx'

function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isPublicPage = !user && ['/login', '/register'].includes(location.pathname)

  return (
    <div className={`app-layout${user ? ' app-layout-authenticated' : ' app-layout-public'}`}>
      <Navbar />
      <div className={`app-main-column${isPublicPage ? ' app-main-public' : ''}`}>
        <main className="app-main">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>WarehouseOS</span>
          <span>Inventory management workspace</span>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
