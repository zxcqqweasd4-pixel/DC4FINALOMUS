import { Link } from 'react-router-dom'

function NotAuthorizedPage() {
  return (
    <section className="status-page text-center py-5">
      <h1 className="h2 fw-semibold">Not authorized</h1>
      <p className="text-secondary">
        This area is available to administrators only.
      </p>
      <Link className="btn btn-primary mt-2" to="/">
        Return to overview
      </Link>
    </section>
  )
}

export default NotAuthorizedPage
