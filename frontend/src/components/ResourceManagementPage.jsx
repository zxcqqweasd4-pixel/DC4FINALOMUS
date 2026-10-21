import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import DataTable from './DataTable.jsx'
import FormInput from './FormInput.jsx'
import Modal from './Modal.jsx'
import Pagination from './Pagination.jsx'
import api from '../services/api.js'

function createEmptyValues(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, '']))
}

function validateValues(fields, values) {
  const errors = {}

  fields.forEach((field) => {
    const value = values[field.name]?.trim() ?? ''

    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`
    } else if (value && field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `${field.label} must be ${field.maxLength} characters or fewer.`
    } else if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = 'Enter a valid email address.'
    }
  })

  return errors
}

function ResourceManagementPage({
  title,
  singularTitle,
  endpoint,
  fields,
  columns,
  emptyMessage,
}) {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loadedPage, setLoadedPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(null)
  const [values, setValues] = useState(() => createEmptyValues(fields))
  const [fieldErrors, setFieldErrors] = useState({})
  const requestId = useRef(0)

  const loadRecords = useCallback(async () => {
    const currentRequestId = ++requestId.current
    setError('')

    try {
      const response = await api.get(endpoint, { params: { page } })
      if (currentRequestId === requestId.current) {
        setRows(response.data.data)
        setPagination(response.data)
      }
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setError(requestError.response?.data?.message || `Could not load ${title.toLowerCase()}.`)
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoadedPage(page)
        setLoading(false)
      }
    }
  }, [endpoint, page, title])

  useEffect(() => {
    let active = true
    const currentRequestId = ++requestId.current

    async function fetchPage() {
      try {
        const response = await api.get(endpoint, { params: { page } })
        if (active && currentRequestId === requestId.current) {
          setRows(response.data.data)
          setPagination(response.data)
          setError('')
        }
      } catch (requestError) {
        if (active && currentRequestId === requestId.current) {
          setError(requestError.response?.data?.message || `Could not load ${title.toLowerCase()}.`)
        }
      } finally {
        if (active && currentRequestId === requestId.current) {
          setLoadedPage(page)
          setLoading(false)
        }
      }
    }

    fetchPage()

    return () => {
      active = false
    }
  }, [endpoint, page, title])

  function openCreateForm() {
    setEditingRecord(null)
    setValues(createEmptyValues(fields))
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }

  function openEditForm(record) {
    setEditingRecord(record)
    setValues(Object.fromEntries(fields.map((field) => [
      field.name,
      record[field.name] ?? '',
    ])))
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const clientErrors = validateValues(fields, values)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSaving(true)
    try {
      const requestValues = Object.fromEntries(
        fields.map((field) => [
          field.name,
          values[field.name].trim() || (field.required ? '' : null),
        ]),
      )

      if (editingRecord) {
        await api.put(`${endpoint}/${editingRecord.id}`, requestValues)
        setSuccess(`${title} updated successfully.`)
      } else {
        await api.post(endpoint, requestValues)
        setSuccess(`${title} created successfully.`)
      }

      setFormOpen(false)
      if (!editingRecord && page !== 1) {
        setPage(1)
      } else {
        setLoading(true)
        await loadRecords()
      }
    } catch (requestError) {
      const response = requestError.response
      if (response?.status === 422) {
        setFieldErrors(Object.fromEntries(
          Object.entries(response.data.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setError(response?.data?.message || `Could not save ${title.toLowerCase()}.`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteRecord) return
    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`${endpoint}/${deleteRecord.id}`)
      setSuccess(`${title} deleted successfully.`)
      setDeleteRecord(null)
      if (rows.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        setLoading(true)
        await loadRecords()
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Could not delete ${title.toLowerCase()}.`)
      setDeleteRecord(null)
    } finally {
      setDeleting(false)
    }
  }

  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (record) => (
        <div className="d-flex justify-content-end gap-2">
          <Button onClick={() => openEditForm(record)} size="sm" variant="outline-primary">
            Edit
          </Button>
          <Button
            onClick={() => setDeleteRecord(record)}
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
          <h1 className="h2 fw-semibold mb-1">{title}</h1>
          <p className="text-secondary mb-0">Manage {title.toLowerCase()} records.</p>
        </div>
        <Button onClick={openCreateForm}>Add {singularTitle}</Button>
      </div>

      {error && !formOpen && <Alert className="mb-3" variant="danger">{error}</Alert>}
      {success && (
        <Alert className="mb-3" onDismiss={() => setSuccess('')} variant="success">
          {success}
        </Alert>
      )}

      <div className="card border-0 shadow-sm">
        <DataTable
          columns={tableColumns}
          emptyMessage={emptyMessage}
          loading={loading || loadedPage !== page}
          rows={rows}
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
            <Button disabled={saving} onClick={() => setFormOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button form="resource-form" loading={saving} type="submit">
              {editingRecord ? 'Save changes' : 'Create'}
            </Button>
          </div>
        )}
        onClose={() => setFormOpen(false)}
        open={formOpen}
        showCloseButton={!saving}
        title={`${editingRecord ? 'Edit' : 'Add'} ${singularTitle.toLowerCase()}`}
      >
        {error && <Alert className="mb-3" variant="danger">{error}</Alert>}
        <form id="resource-form" noValidate onSubmit={handleSubmit}>
          {fields.map((field) => (
            <FormInput
              key={field.name}
              error={fieldErrors[field.name]}
              label={field.label}
              maxLength={field.maxLength}
              name={field.name}
              onChange={updateField}
              required={field.required}
              rows={field.rows}
              type={field.type || 'text'}
              value={values[field.name]}
            />
          ))}
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Delete"
        loading={deleting}
        message={deleteRecord
          ? `Delete "${deleteRecord.name}"? This action cannot be undone.`
          : 'Are you sure you want to continue?'}
        onCancel={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteRecord)}
        title={`Delete ${singularTitle.toLowerCase()}`}
      />
    </section>
  )
}

export default ResourceManagementPage
