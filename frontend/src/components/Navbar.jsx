import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const pageTitles = {
  '/': 'Overview',
  '/items': 'Items',
  '/stock-requests': 'Stock requests',
  '/admin': 'Dashboard',
  '/admin/overview': 'Admin tools',
  '/admin/categories': 'Categories',
  '/admin/suppliers': 'Suppliers',
  '/admin/users': 'Users',
  '/login': 'Sign in',
  '/register': 'Create account',
}

function NavigationLinks({ isAdmin, onNavigate }) {
  const links = [
    { to: isAdmin ? '/admin' : '/', label: isAdmin ? 'Dashboard' : 'Overview', icon: 'D', end: true },
    { to: '/items', label: 'Items', icon: 'I' },
    { to: '/stock-requests', label: 'Requests', icon: 'R' },
    ...(isAdmin ? [
      { to: '/admin/categories', label: 'Categories', icon: 'C' },
      { to: '/admin/suppliers', label: 'Suppliers', icon: 'S' },
      { to: '/admin/users', label: 'Users', icon: 'U' },
    ] : []),
  ]

  return links.map((link) => (
    <NavLink
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      end={link.end}
      key={link.to}
      onClick={onNavigate}
      to={link.to}
    >
      <span aria-hidden="true" className="sidebar-link-icon">{link.icon}</span>
      <span>{link.label}</span>
    </NavLink>
  ))
}

function Navbar() {
  const { user, logout, sessionError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutError, setLogoutError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = user?.role === 'admin'
  const isRegisterPage = location.pathname === '/register'
  const pageTitle = pageTitles[location.pathname] || 'Inventory'

  async function handleLogout() {
    setLogoutError('')

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Your local session ended, but the server could not confirm logout.')
      navigate('/login', { replace: true })
    }
  }

  if (!user) {
    return (
      <header className="public-header">
        <div className="public-header-inner">
          <NavLink className="app-brand" to="/">
            <span aria-hidden="true" className="app-brand-mark">W</span>
            <span>Warehouse<span className="app-brand-light">OS</span></span>
          </NavLink>
          <div className="public-header-actions">
            <NavLink
              className="btn btn-primary btn-sm"
              to={isRegisterPage ? '/login' : '/register'}
            >
              {isRegisterPage ? 'Sign in' : 'Create account'}
            </NavLink>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <aside aria-label="Main navigation" className="app-sidebar">
        <NavLink className="app-brand" onClick={() => setMobileMenuOpen(false)} to="/">
          <span aria-hidden="true" className="app-brand-mark">W</span>
          <span>Warehouse<span className="app-brand-light">OS</span></span>
        </NavLink>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-navigation">
          <NavigationLinks isAdmin={isAdmin} onNavigate={() => setMobileMenuOpen(false)} />
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span aria-hidden="true" className="sidebar-avatar">
              {user.name?.trim().charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="sidebar-user-copy">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{isAdmin ? 'Administrator' : 'Staff member'}</span>
            </span>
          </div>
        </div>
      </aside>

      <header className="app-topbar">
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar-page-title">
          <span className="topbar-eyebrow">INVENTORY WORKSPACE</span>
          <h1>{pageTitle}</h1>
        </div>
        <div className="topbar-actions">
          <div className="topbar-identity">
            <span className="topbar-user-name">{user.name}</span>
            <span className={`role-badge${isAdmin ? ' role-badge-admin' : ''}`}>
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </div>
          <button className="btn btn-logout" onClick={handleLogout} type="button">
            <span aria-hidden="true" className="logout-icon" />
            <span className="logout-label">Log out</span>
          </button>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className={`mobile-navigation${mobileMenuOpen ? ' mobile-navigation-open' : ''}`}
        hidden={!mobileMenuOpen}
      >
        <NavigationLinks isAdmin={isAdmin} onNavigate={() => setMobileMenuOpen(false)} />
        <div className="mobile-navigation-user">
          <span className="topbar-user-name">{user.name}</span>
          <span className={`role-badge${isAdmin ? ' role-badge-admin' : ''}`}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>
      </nav>

      {(sessionError || logoutError) && (
        <div className="app-session-alert">
          <div className="alert alert-warning mb-0" role="alert">
            {logoutError || sessionError}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
