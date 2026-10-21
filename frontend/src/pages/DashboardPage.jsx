import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Spinner from '../components/Spinner.jsx'
import api from '../services/api.js'

const metrics = [
  {
    key: 'total_items',
    label: 'Total items',
    description: 'Active inventory records',
    color: 'primary',
  },
  {
    key: 'low_stock_items',
    label: 'Low-stock items',
    description: 'At or below reorder level',
    color: 'warning',
  },
  {
    key: 'pending_requests',
    label: 'Pending requests',
    description: 'Awaiting an admin decision',
    color: 'info',
  },
  {
    key: 'total_inventory_value',
    label: 'Inventory value',
    description: 'Current quantity x unit price',
    color: 'success',
    money: true,
  },
  {
    key: 'stock_movements_this_week',
    label: 'Movements this week',
    description: 'Stock movements this week',
    color: 'secondary',
  },
]

function formatMetric(value, money = false) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat(undefined, money
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : {}).format(amount)
}

function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSummary() {
      try {
        const response = await api.get('/dashboard')
        if (active) setSummary(response.data.data ?? response.data)
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'Could not load dashboard summary.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [])

  return (
    <section>
      <div className="mb-4">
        <span className="badge text-bg-primary mb-2">Administrator overview</span>
        <h1 className="h2 fw-semibold mb-1">Dashboard</h1>
        <p className="text-secondary mb-0">A summary of your inventory and activity.</p>
      </div>

      {error && <Alert className="mb-3" variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner label="Loading dashboard summary..." />
      ) : summary && (
        <div className="row g-3">
          {metrics.map((metric) => (
            <div className="col-12 col-sm-6 col-xl-4" key={metric.key}>
              <article className={`card dashboard-metric-card dashboard-metric-${metric.color} h-100`}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className="dashboard-metric-label mb-2">{metric.label}</p>
                      <p className="dashboard-metric-value mb-2">
                        {formatMetric(summary[metric.key], metric.money)}
                      </p>
                      <p className="dashboard-metric-description mb-0">{metric.description}</p>
                    </div>
                    <span className={`dashboard-metric-icon dashboard-metric-icon-${metric.color}`} aria-hidden="true">
                      {metric.key === 'total_items' ? '#' : metric.key === 'low_stock_items' ? '!' : metric.key === 'pending_requests' ? 'P' : metric.money ? 'V' : 'M'}
                    </span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
      <div className="d-flex flex-wrap gap-2 mt-4">
        <Link className="btn btn-outline-primary" to="/admin/categories">Manage categories</Link>
        <Link className="btn btn-outline-primary" to="/admin/suppliers">Manage suppliers</Link>
        <Link className="btn btn-outline-primary" to="/admin/users">Manage users</Link>
        <Link className="btn btn-outline-primary" to="/items">Manage items</Link>
        <Link className="btn btn-outline-secondary" to="/admin/overview">More admin tools</Link>
      </div>
    </section>
  )
}

export default DashboardPage
