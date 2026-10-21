import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import FormInput from '../components/FormInput.jsx'
import { useAuth } from '../hooks/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    else if (values.name.length > 255) nextErrors.name = 'Name must be 255 characters or fewer.'
    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (!values.password) nextErrors.password = 'Password is required.'
    else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (!values.password_confirmation) nextErrors.password_confirmation = 'Please confirm your password.'
    else if (values.password !== values.password_confirmation) {
      nextErrors.password_confirmation = 'Passwords do not match.'
    }
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
      await register(values)
      navigate('/', { replace: true })
    } catch (error) {
      const response = error.response
      if (response?.status === 422) {
        setErrors(Object.fromEntries(
          Object.entries(response.data.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setMessage(response?.data?.message || 'Unable to register. Check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page auth-page-register">
      <div className="card auth-card">
        <div className="card-body p-4 p-md-5">
          <p className="auth-kicker">Get started</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">New accounts are registered with the staff role.</p>
          {message && <Alert variant="danger">{message}</Alert>}
          <form noValidate onSubmit={handleSubmit}>
            <FormInput
              autoComplete="name"
              error={errors.name}
              label="Full name"
              maxLength={255}
              name="name"
              onChange={updateField}
              required
              value={values.name}
            />
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
              autoComplete="new-password"
              error={errors.password}
              label="Password"
              minLength={8}
              name="password"
              onChange={updateField}
              required
              type="password"
              value={values.password}
            />
            <FormInput
              autoComplete="new-password"
              className="mb-4"
              error={errors.password_confirmation}
              label="Confirm password"
              name="password_confirmation"
              onChange={updateField}
              required
              type="password"
              value={values.password_confirmation}
            />
            <Button className="w-100" loading={submitting} type="submit">
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-secondary mt-4 mb-0">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
