import { Link } from 'react-router-dom'

function AdminHomePage() {
  return (
    <section className="admin-tools-page py-2">
      <span className="badge text-bg-primary mb-3">Administrator tools</span>
      <h1 className="display-5 fw-semibold">Admin access verified</h1>
      <p className="lead text-secondary">
        Choose a resource to manage.
      </p>
      <div className="row g-3 mt-3">
        <div className="col-12 col-md-6">
          <Link className="card admin-resource-card card-body h-100 text-decoration-none" to="/admin/categories">
            <span className="h5 text-body">Categories</span>
            <span className="text-secondary">Organize inventory into categories.</span>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link className="card admin-resource-card card-body h-100 text-decoration-none" to="/admin/suppliers">
            <span className="h5 text-body">Suppliers</span>
            <span className="text-secondary">Maintain supplier contact details.</span>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link className="card admin-resource-card card-body h-100 text-decoration-none" to="/admin/users">
            <span className="h5 text-body">Users</span>
            <span className="text-secondary">Manage accounts and access roles.</span>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link className="card admin-resource-card card-body h-100 text-decoration-none" to="/items">
            <span className="h5 text-body">Items</span>
            <span className="text-secondary">Manage inventory records and stock levels.</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AdminHomePage
