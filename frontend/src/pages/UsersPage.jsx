import { useEffect, useState } from 'react'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DataTable from '../components/DataTable.jsx'
import FormInput from '../components/FormInput.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import api from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'

const emptyValues = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'staff',
}

function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loadedPage, setLoadedPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const response = await api.get('/users', { params: { page } })
        if (active) {
          setUsers(response.data.data)
          setPagination(response.data)
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Could not load users.')
      } finally {
        if (active) {
          setLoadedPage(page)
          setLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [page])

  function openCreate() {
    setEditingUser(null)
    setValues(emptyValues)
    setErrors({})
    setError('')
    setFormOpen(true)
  }

  function openEdit(record) {
    setEditingUser(record)
    setValues({
      name: record.name ?? '',
      email: record.email ?? '',
      password: '',
      password_confirmation: '',
      role: record.role ?? 'staff',
    })
    setErrors({})
    setError('')
    setFormOpen(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validate() {
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!editingUser || values.password || values.password_confirmation) {
      if (!values.password) nextErrors.password = 'Password is required.'
      else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
      if (!values.password_confirmation) {
        nextErrors.password_confirmation = 'Please confirm the password.'
      } else if (values.password !== values.password_confirmation) {
        nextErrors.password_confirmation = 'Passwords do not match.'
      }
    }
    return nextErrors
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
    }
    if (!editingUser || values.password) {
      payload.password = values.password
      payload.password_confirmation = values.password_confirmation
    }

    setSaving(true)
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload)
        setSuccess('User updated successfully.')
      } else {
        await api.post('/users', payload)
        setSuccess('User created successfully.')
      }
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(Object.fromEntries(
          Object.entries(requestError.response.data.errors ?? {})
            .map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setError(requestError.response?.data?.message || 'Could not save user.')
      }
      return
    } finally {
      setSaving(false)
    }

    setFormOpen(false)
    if (!editingUser && page !== 1) {
      setPage(1)
    } else {
      try {
        const response = await api.get('/users', { params: { page } })
        setUsers(response.data.data)
        setPagination(response.data)
        setLoadedPage(page)
      } catch (refreshError) {
        setError(refreshError.response?.data?.message || 'User was saved, but the list could not be refreshed.')
      }
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setDeleting(true)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/users/${deleteUser.id}`)
      setDeleteUser(null)
      setSuccess('User deleted successfully.')
      if (users.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        try {
          const response = await api.get('/users', { params: { page } })
          setUsers(response.data.data)
          setPagination(response.data)
        } catch (refreshError) {
          setError(refreshError.response?.data?.message || 'User was deleted, but the list could not be refreshed.')
        }
      }
    } catch (requestError) {
      setDeleteUser(null)
      setError(requestError.response?.data?.message || 'Could not delete user.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (record) => (
        <span className={`badge text-bg-${record.role === 'admin' ? 'primary' : 'secondary'}`}>
          {record.role}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (record) => (
        <div className="d-flex justify-content-end gap-2">
          <Button onClick={() => openEdit(record)} size="sm" variant="outline-primary">Edit</Button>
          <Button
            disabled={record.id === currentUser?.id}
            onClick={() => setDeleteUser(record)}
            size="sm"
            variant="outline-danger"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-semibold mb-1">Users</h1>
          <p className="text-secondary mb-0">Manage user accounts and roles.</p>
        </div>
        <Button onClick={openCreate}>Add user</Button>
      </div>
      {error && !formOpen && <Alert className="mb-3" variant="danger">{error}</Alert>}
      {success && <Alert className="mb-3" onDismiss={() => setSuccess('')} variant="success">{success}</Alert>}
      <div className="card border-0 shadow-sm">
        <DataTable
          columns={columns}
          emptyMessage="No user accounts found."
          loading={loading || loadedPage !== page}
          rows={users}
        />
      </div>
      {pagination && !loading && loadedPage === page && (
        <div className="mt-3">
          <Pagination
            currentPage={pagination.current_page}
            from={pagination.from}
            lastPage={pagination.last_page}
            onPageChange={setPage}
            to={pagination.to}
            total={pagination.total}
          />
        </div>
      )}

      <Modal
        closeOnBackdrop={!saving}
        closeOnEscape={!saving}
        footer={(
          <div className="d-flex justify-content-end gap-2">
            <Button disabled={saving} onClick={() => setFormOpen(false)} variant="secondary">Cancel</Button>
            <Button form="user-form" loading={saving} type="submit">{editingUser ? 'Save changes' : 'Create user'}</Button>
          </div>
        )}
        onClose={() => setFormOpen(false)}
        open={formOpen}
        showCloseButton={!saving}
        title={editingUser ? 'Edit user' : 'Add user'}
      >
        {error && <Alert className="mb-3" variant="danger">{error}</Alert>}
        <form id="user-form" noValidate onSubmit={handleSave}>
          <FormInput autoComplete="name" error={errors.name} label="Name" maxLength={255} name="name" onChange={updateField} required value={values.name} />
          <FormInput autoComplete="email" error={errors.email} label="Email" maxLength={255} name="email" onChange={updateField} required type="email" value={values.email} />
          <FormInput
            error={errors.role}
            label="Role"
            name="role"
            onChange={updateField}
            required
            type="select"
            value={values.role}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </FormInput>
          <FormInput
            autoComplete="new-password"
            error={errors.password}
            helpText={editingUser ? 'Leave blank to keep the existing password.' : undefined}
            label="Password"
            minLength={8}
            name="password"
            onChange={updateField}
            required={!editingUser}
            type="password"
            value={values.password}
          />
          <FormInput
            autoComplete="new-password"
            error={errors.password_confirmation}
            label="Confirm password"
            name="password_confirmation"
            onChange={updateField}
            required={!editingUser || Boolean(values.password)}
            type="password"
            value={values.password_confirmation}
          />
        </form>
      </Modal>
      <ConfirmDialog
        confirmLabel="Delete"
        loading={deleting}
        message={deleteUser
          ? `Delete account "${deleteUser.name}"? Users with related inventory activity cannot be deleted.`
          : 'Are you sure you want to continue?'}
        onCancel={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteUser)}
        title="Delete user"
      />
    </section>
  )
}

export default UsersPage
