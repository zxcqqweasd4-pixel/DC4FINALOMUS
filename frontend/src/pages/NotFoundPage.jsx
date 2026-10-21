import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="text-center py-5">
      <h1 className="display-6">Page not found</h1>
      <p className="text-secondary">The page you requested does not exist.</p>
      <Link className="btn btn-primary mt-2" to="/">
        Return to overview
      </Link>
    </section>
  )
}

export default NotFoundPage
