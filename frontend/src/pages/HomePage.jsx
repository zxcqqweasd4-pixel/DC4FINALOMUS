import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const shortcuts = [
    {
      title: 'Browse items',
      description: 'Search inventory by name or SKU, filter by category or supplier, and check stock levels.',
      to: '/items',
      action: 'View items',
      className: 'primary',
    },
    {
      title: isAdmin ? 'Review stock requests' : 'Your stock requests',
      description: isAdmin
        ? 'Review incoming requests and approve, reject, or complete the next valid action.'
        : 'Submit a stock request and track its status.',
      to: '/stock-requests',
      action: isAdmin ? 'Manage requests' : 'View requests',
      className: 'success',
    },
    ...(isAdmin ? [
      {
        title: 'Dashboard',
        description: 'See inventory totals, low-stock items, pending requests, inventory value, and weekly movements.',
        to: '/admin',
        action: 'Open dashboard',
        className: 'info',
      },
      {
        title: 'Manage catalog',
        description: 'Maintain categories, suppliers, items, and user accounts.',
        to: '/admin/overview',
        action: 'Manage resources',
        className: 'secondary',
      },
    ] : []),
  ]

  return (
    <section>
      <div className="home-welcome-card rounded-3 bg-white border shadow-sm p-4 p-md-5 mb-4">
        <span className="badge text-bg-primary mb-3">
          {isAdmin ? 'Administrator workspace' : 'Staff workspace'}
        </span>
        <h1 className="display-6 fw-semibold mb-2">
          Welcome, {user?.name || 'there'}
        </h1>
        <p className="lead text-secondary mb-0">
          {isAdmin
            ? 'Manage inventory and keep your team’s stock requests moving.'
            : 'Browse available inventory, submit requests, and record stock going out.'}
        </p>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h4 fw-semibold mb-0">Quick links</h2>
        <span className="badge text-bg-light border text-secondary">
          Signed in as {user?.role}
        </span>
      </div>
      <div className="row g-3">
        {shortcuts.map((shortcut) => (
          <div className="col-12 col-md-6" key={shortcut.to}>
            <article className="card quick-link-card h-100">
              <div className="card-body d-flex flex-column p-4">
                <span className={`badge text-bg-${shortcut.className} align-self-start mb-3`}>
                  {shortcut.title}
                </span>
                <p className="text-secondary flex-grow-1">{shortcut.description}</p>
                <Link className="btn btn-outline-primary align-self-start mt-3" to={shortcut.to}>
                  {shortcut.action}
                </Link>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomePage
