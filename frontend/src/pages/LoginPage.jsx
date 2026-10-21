import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import FormInput from '../components/FormInput.jsx'
import { useAuth } from '../hooks/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const nextErrors = {}
    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (!values.password) nextErrors.password = 'Password is required.'
    return nextErrors
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    const clientErrors = validate()
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    try {
      await login(values)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) {
      const response = error.response
      if (response?.status === 422) {
        setErrors(Object.fromEntries(
          Object.entries(response.data.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setMessage(response?.data?.message || 'Unable to log in. Check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page auth-page-login">
      <div className="card auth-card">
        <div className="card-body p-4 p-md-5">
          <p className="auth-kicker">Welcome back</p>
          <h1 className="auth-title">Sign in to your workspace</h1>
          <p className="auth-subtitle">Enter your account details to continue.</p>
          {message && <Alert variant="danger">{message}</Alert>}
          <form noValidate onSubmit={handleSubmit}>
            <FormInput
              autoComplete="email"
              error={errors.email}
              label="Email address"
              name="email"
              onChange={updateField}
              required
              type="email"
              value={values.email}
            />
            <FormInput
              autoComplete="current-password"
              className="mb-4"
              error={errors.password}
              label="Password"
              name="password"
              onChange={updateField}
              required
              type="password"
              value={values.password}
            />
            <Button className="w-100" loading={submitting} type="submit">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-secondary mt-4 mb-0">
            Need an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
