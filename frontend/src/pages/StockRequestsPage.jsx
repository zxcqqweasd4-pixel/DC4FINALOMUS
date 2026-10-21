import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DataTable from '../components/DataTable.jsx'
import FormInput from '../components/FormInput.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import Spinner from '../components/Spinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../hooks/useAuth.js'
import api from '../services/api.js'
import { fetchAllPaginated } from '../services/pagination.js'

const PAGE_SIZE = 15

function getNextActions(status) {
  if (status === 'pending') {
    return [
      { status: 'approved', label: 'Approve', variant: 'outline-primary' },
      { status: 'rejected', label: 'Reject', variant: 'outline-danger' },
    ]
  }

  if (status === 'approved') {
    return [{ status: 'completed', label: 'Complete', variant: 'outline-success' }]
  }

  return []
}

function StockRequestsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const requestedItemId = location.state?.itemId
  const [requests, setRequests] = useState([])
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState('')
  const [listError, setListError] = useState('')
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formOpen, setFormOpen] = useState(Boolean(requestedItemId))
  const [pendingAction, setPendingAction] = useState(null)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(() => ({
    item_id: requestedItemId ? String(requestedItemId) : '',
    direction: 'out',
    quantity: '1',
    reason: '',
  }))

  useEffect(() => {
    let active = true

    async function loadItems() {
      try {
        const allItems = await fetchAllPaginated('/items')
        if (active) setItems(allItems)
      } catch (requestError) {
        if (active) {
          setItemsError(requestError.response?.data?.message || requestError.message || 'Could not load items for the request form.')
        }
      } finally {
        if (active) setItemsLoading(false)
      }
    }

    loadItems()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadRequests() {
      setListError('')
      try {
        const allRequests = await fetchAllPaginated('/stock-requests')
        if (active) {
          setRequests(allRequests)
          setLoaded(true)
        }
      } catch (requestError) {
        if (active) {
          setListError(requestError.response?.data?.message || requestError.message || 'Could not load stock requests.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRequests()
    return () => {
      active = false
    }
  }, [])

  const filteredRequests = useMemo(
    // The API index has no status parameter, so filter the full paginated result locally.
    () => statusFilter === 'all'
      ? requests
      : requests.filter((request) => request.status === statusFilter),
    [requests, statusFilter],
  )
  const lastPage = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const visibleRequests = filteredRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const pagination = {
    current_page: currentPage,
    last_page: lastPage,
    total: filteredRequests.length,
    from: filteredRequests.length ? (currentPage - 1) * PAGE_SIZE + 1 : null,
    to: Math.min(currentPage * PAGE_SIZE, filteredRequests.length),
  }

  async function refreshRequests() {
    setLoading(true)
    setListError('')
    try {
      const allRequests = await fetchAllPaginated('/stock-requests')
      setRequests(allRequests)
      setLoaded(true)
    } catch (requestError) {
      setListError(requestError.response?.data?.message || requestError.message || 'Could not refresh stock requests.')
    } finally {
      setLoading(false)
    }
  }

  function openForm(itemId = '') {
    setValues({
      item_id: itemId ? String(itemId) : '',
      direction: 'out',
      quantity: '1',
      reason: '',
    })
    setErrors({})
    setActionError('')
    setFormOpen(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setActionError('')
    const validationErrors = {}
    if (!values.item_id) validationErrors.item_id = 'Select an item.'
    if (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) < 1) {
      validationErrors.quantity = 'Quantity must be a whole number of at least 1.'
    }
    if (!values.reason.trim()) validationErrors.reason = 'Reason is required.'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    setSaving(true)
    try {
      await api.post('/stock-requests', {
        item_id: Number(values.item_id),
        direction: values.direction,
        quantity: Number(values.quantity),
        reason: values.reason.trim(),
      })
      setFormOpen(false)
      setSuccess('Stock request submitted successfully.')
      setStatusFilter('all')
      setPage(1)
      await refreshRequests()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(Object.fromEntries(
          Object.entries(requestError.response.data.errors ?? {})
            .map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setActionError(requestError.response?.data?.message || 'Could not submit the stock request.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus() {
    if (!pendingAction) return
    setUpdating(true)
    setActionError('')
    setSuccess('')

    try {
      const { request, status } = pendingAction
      const response = await api.patch(`/stock-requests/${request.id}/status`, { status })
      setRequests((current) => current.map((entry) => (
        entry.id === request.id ? response.data : entry
      )))
      setSuccess(`Request #${request.id} marked ${status}.`)
      setPendingAction(null)
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        const serverErrors = requestError.response.data.errors ?? {}
        setActionError(Object.values(serverErrors).flat()[0] || 'That status transition is invalid.')
      } else {
        setActionError(requestError.response?.data?.message || 'Could not update request status.')
      }
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Request',
      render: (request) => `#${request.id}`,
    },
    {
      key: 'item',
      label: 'Item',
      render: (request) => request.item?.name || `Item #${request.item_id}`,
    },
    ...(isAdmin ? [{
      key: 'user',
      label: 'Requested by',
      render: (request) => request.user?.name || '—',
    }] : []),
    {
      key: 'direction',
      label: 'Direction',
      render: (request) => <StatusBadge status={request.direction} />,
    },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status',
      label: 'Status',
      render: (request) => <StatusBadge status={request.status} />,
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (request) => request.created_at
        ? new Date(request.created_at).toLocaleDateString()
        : '—',
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (request) => (
        <div className="d-flex flex-wrap gap-2">
          {getNextActions(request.status).map((action) => (
            <Button
              disabled={updating}
              key={action.status}
              onClick={() => setPendingAction({ request, ...action })}
              size="sm"
              variant={action.variant}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ),
    }] : []),
  ]

  return (
    <section>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-semibold mb-1">Stock requests</h1>
          <p className="text-secondary mb-0">
            {isAdmin ? 'Review requests and update their status.' : 'Request stock and track your requests.'}
          </p>
        </div>
        <Button onClick={() => openForm(requestedItemId || '')}>New request</Button>
      </div>

      {listError && <Alert className="mb-3" variant="danger">{listError}</Alert>}
      {itemsError && <Alert className="mb-3" variant="warning">{itemsError}</Alert>}
      {actionError && !formOpen && (
        <Alert className="mb-3" variant="danger">{actionError}</Alert>
      )}
      {success && (
        <Alert className="mb-3" onDismiss={() => setSuccess('')} variant="success">
          {success}
        </Alert>
      )}

      <div className="card card-body border-0 shadow-sm mb-3">
        <div className="row align-items-end g-3">
          <div className="col-12 col-sm-6 col-md-4">
            <FormInput
              className="mb-0"
              label="Filter by status"
              name="status_filter"
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              type="select"
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </FormInput>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <DataTable
          columns={columns}
          emptyMessage={statusFilter === 'all'
            ? 'No stock requests have been submitted.'
            : `No ${statusFilter} stock requests.`}
          loading={loading || !loaded}
          rows={visibleRequests}
          showEmptyState={!listError && !loading && loaded}
        />
      </div>
      {loaded && !listError && !loading && pagination.total > 0 && (
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
            <Button form="stock-request-form" loading={saving} type="submit">
              Submit request
            </Button>
          </div>
        )}
        onClose={() => setFormOpen(false)}
        open={formOpen}
        showCloseButton={!saving}
        title="New stock request"
      >
        {itemsError && <Alert className="mb-3" variant="danger">{itemsError}</Alert>}
        {actionError && <Alert className="mb-3" variant="danger">{actionError}</Alert>}
        {itemsLoading ? (
          <Spinner label="Loading item choices..." size="sm" />
        ) : (
          <form id="stock-request-form" noValidate onSubmit={handleCreate}>
            <FormInput
              error={errors.item_id}
              label="Item"
              name="item_id"
              onChange={updateField}
              required
              type="select"
              value={values.item_id}
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
              ))}
            </FormInput>
            <FormInput
              label="Direction"
              name="direction"
              onChange={updateField}
              required
              type="select"
              value={values.direction}
            >
              <option value="out">Request stock out</option>
              <option value="in">Request stock in</option>
            </FormInput>
            <FormInput
              error={errors.quantity}
              label="Quantity"
              min="1"
              name="quantity"
              onChange={updateField}
              required
              step="1"
              type="number"
              value={values.quantity}
            />
            <FormInput
              error={errors.reason}
              label="Reason"
              name="reason"
              onChange={updateField}
              required
              type="textarea"
              value={values.reason}
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        confirmLabel={pendingAction?.label || 'Confirm'}
        confirmVariant={pendingAction?.variant?.replace('outline-', '') || 'primary'}
        loading={updating}
        message={pendingAction
          ? `Are you sure you want to ${pendingAction.status} request #${pendingAction.request.id} for ${pendingAction.request.quantity} unit(s) of ${pendingAction.request.item?.name || 'this item'}?`
          : 'Are you sure you want to continue?'}
        onCancel={() => setPendingAction(null)}
        onConfirm={updateStatus}
        open={Boolean(pendingAction)}
        title={`${pendingAction?.label || 'Update'} request`}
      />
    </section>
  )
}

export default StockRequestsPage
