import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import DataTable from '../components/DataTable.jsx'
import FormInput from '../components/FormInput.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import api from '../services/api.js'
import { fetchAllPaginated } from '../services/pagination.js'

const emptyItem = {
  category_id: '',
  supplier_id: '',
  name: '',
  sku: '',
  unit: '',
  quantity: '0',
  reorder_level: '0',
  unit_price: '0',
  description: '',
  image_path: '',
}

const itemFields = [
  { name: 'name', label: 'Item name', required: true, maxLength: 255 },
  { name: 'sku', label: 'SKU', required: true, maxLength: 255 },
  { name: 'category_id', label: 'Category', type: 'select', required: true },
  { name: 'supplier_id', label: 'Supplier', type: 'select', required: true },
  { name: 'unit', label: 'Unit', required: true, maxLength: 50 },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'reorder_level', label: 'Reorder level', type: 'number', required: true },
  { name: 'unit_price', label: 'Unit price', type: 'number', required: true },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { name: 'image_path', label: 'Image path', maxLength: 2048 },
]

function ItemsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    supplier_id: '',
    low_stock: false,
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stockingOut, setStockingOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [stockOutItem, setStockOutItem] = useState(null)
  const [itemValues, setItemValues] = useState(emptyItem)
  const [stockOutValues, setStockOutValues] = useState({ quantity: '1', remarks: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [stockOutErrors, setStockOutErrors] = useState({})
  const [loadedPage, setLoadedPage] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchAllPaginated('/categories'),
      fetchAllPaginated('/suppliers'),
    ]).then(([categoryResponse, supplierResponse]) => {
      if (active) {
        setCategories(categoryResponse)
        setSuppliers(supplierResponse)
      }
    }).catch((requestError) => {
      if (active) {
        setOptionsError(requestError.response?.data?.message || 'Could not load category and supplier options.')
      }
    }).finally(() => {
      if (active) setOptionsLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        search: appliedFilters.search || undefined,
        category_id: appliedFilters.category_id || undefined,
        supplier_id: appliedFilters.supplier_id || undefined,
        low_stock: appliedFilters.low_stock ? 1 : undefined,
      }
      const response = await api.get('/items', { params })
      setItems(response.data.data)
      setPagination(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load items.')
    } finally {
      setLoadedPage(page)
      setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    let active = true

    async function fetchItems() {
      setError('')
      try {
        const response = await api.get('/items', {
          params: {
            page,
            search: appliedFilters.search || undefined,
            category_id: appliedFilters.category_id || undefined,
            supplier_id: appliedFilters.supplier_id || undefined,
            low_stock: appliedFilters.low_stock ? 1 : undefined,
          },
        })
        if (active) {
          setItems(response.data.data)
          setPagination(response.data)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'Could not load items.')
        }
      } finally {
        if (active) {
          setLoadedPage(page)
          setLoading(false)
        }
      }
    }

    fetchItems()
    return () => {
      active = false
    }
  }, [appliedFilters, page])

  function openCreateForm() {
    setEditingItem(null)
    setItemValues(emptyItem)
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }

  function openEditForm(item) {
    setEditingItem(item)
    setItemValues(Object.fromEntries(
      Object.keys(emptyItem).map((key) => [key, item[key] ?? '']),
    ))
    setFieldErrors({})
    setError('')
    setFormOpen(true)
  }

  function updateItemField(event) {
    const { name, value } = event.target
    setItemValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validateItem() {
    const errors = {}
    for (const field of itemFields) {
      const value = itemValues[field.name]
      if (field.required && !String(value).trim()) {
        errors[field.name] = `${field.label} is required.`
      } else if (field.maxLength && String(value).length > field.maxLength) {
        errors[field.name] = `${field.label} must be ${field.maxLength} characters or fewer.`
      } else if (field.type === 'number' && (Number(value) < 0 || value === '')) {
        errors[field.name] = `${field.label} must be zero or greater.`
      } else if (
        ['quantity', 'reorder_level'].includes(field.name)
        && !Number.isInteger(Number(value))
      ) {
        errors[field.name] = `${field.label} must be a whole number.`
      }
    }
    return errors
  }

  async function handleSaveItem(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const validationErrors = validateItem()
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    const payload = {
      ...itemValues,
      category_id: Number(itemValues.category_id),
      supplier_id: Number(itemValues.supplier_id),
      quantity: Number(itemValues.quantity),
      reorder_level: Number(itemValues.reorder_level),
      unit_price: Number(itemValues.unit_price),
      description: itemValues.description || null,
      image_path: itemValues.image_path || null,
    }

    setSaving(true)
    try {
      if (editingItem) {
        await api.put(`/items/${editingItem.id}`, payload)
        setSuccess('Item updated successfully.')
      } else {
        await api.post('/items', payload)
        setSuccess('Item created successfully.')
      }
      setFormOpen(false)
      if (!editingItem && page !== 1) {
        setPage(1)
      } else {
        setLoading(true)
        await loadItems()
      }
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setFieldErrors(Object.fromEntries(
          Object.entries(requestError.response.data.errors ?? {})
            .map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setError(requestError.response?.data?.message || 'Could not save item.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem() {
    if (!deleteItem) return
    setDeleting(true)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/items/${deleteItem.id}`)
      setSuccess('Item deleted successfully.')
      setDeleteItem(null)
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        setLoading(true)
        await loadItems()
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete item.')
      setDeleteItem(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStockOut(event) {
    event.preventDefault()
    const errors = {}
    const quantity = Number(stockOutValues.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.quantity = 'Quantity must be a whole number greater than zero.'
    }
    setStockOutErrors(errors)
    if (Object.keys(errors).length) return

    setStockingOut(true)
    setError('')
    setSuccess('')
    try {
      await api.post(`/items/${stockOutItem.id}/stock-out`, {
        quantity,
        remarks: stockOutValues.remarks || null,
      })
      setStockOutItem(null)
      setStockOutValues({ quantity: '1', remarks: '' })
      setSuccess('Stock-out recorded successfully.')
      setLoading(true)
      await loadItems()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setStockOutErrors(Object.fromEntries(
          Object.entries(requestError.response.data.errors ?? {})
            .map(([field, messages]) => [field, messages[0]]),
        ))
      } else {
        setError(requestError.response?.data?.message || 'Could not record stock-out.')
      }
    } finally {
      setStockingOut(false)
    }
  }

  function updateFilter(event) {
    const { name, value, checked, type } = event.target
    setFilters((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setLoading(true)
    setPage(1)
    setAppliedFilters(filters)
  }

  const columns = [
    { key: 'name', label: 'Item' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'category',
      label: 'Category',
      render: (item) => item.category?.name || '—',
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (item) => item.supplier?.name || '—',
    },
    {
      key: 'quantity',
      label: 'Stock',
      render: (item) => (
        <span className="d-inline-flex align-items-center gap-2">
          {item.quantity} {item.unit}
          {item.quantity <= item.reorder_level && (
            <span className="badge text-bg-warning">Low stock</span>
          )}
        </span>
      ),
    },
    {
      key: 'unit_price',
      label: 'Unit price',
      render: (item) => Number(item.unit_price).toFixed(2),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (item) => (
        <div className="d-flex justify-content-end flex-wrap gap-2">
          {!isAdmin && (
            <>
              <Button
                onClick={() => navigate('/stock-requests', { state: { itemId: item.id } })}
                size="sm"
                variant="outline-primary"
              >
                Request stock
              </Button>
              <Button onClick={() => {
                setStockOutItem(item)
                setStockOutErrors({})
              }} size="sm" variant="outline-warning">
                Stock out
              </Button>
            </>
          )}
          {isAdmin && (
            <>
              <Button onClick={() => openEditForm(item)} size="sm" variant="outline-primary">Edit</Button>
              <Button onClick={() => setDeleteItem(item)} size="sm" variant="outline-danger">Delete</Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <section>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-semibold mb-1">Items</h1>
          <p className="text-secondary mb-0">Search and browse inventory.</p>
        </div>
        {isAdmin && (
          <Button disabled={optionsLoading || Boolean(optionsError)} onClick={openCreateForm}>
            Add item
          </Button>
        )}
      </div>

      {error && !formOpen && !stockOutItem && <Alert className="mb-3" variant="danger">{error}</Alert>}
      {optionsError && <Alert className="mb-3" variant="warning">{optionsError}</Alert>}
      {success && (
        <Alert className="mb-3" onDismiss={() => setSuccess('')} variant="success">
          {success}
        </Alert>
      )}

      <form className="card card-body border-0 shadow-sm mb-3" onSubmit={applyFilters}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-xl-3">
            <label className="form-label" htmlFor="item-search">Keyword</label>
            <input
              className="form-control"
              id="item-search"
              name="search"
              onChange={updateFilter}
              placeholder="Name or SKU"
              value={filters.search}
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-2">
            <label className="form-label" htmlFor="item-category-filter">Category</label>
            <select className="form-select" id="item-category-filter" name="category_id" onChange={updateFilter} value={filters.category_id}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-xl-2">
            <label className="form-label" htmlFor="item-supplier-filter">Supplier</label>
            <select className="form-select" id="item-supplier-filter" name="supplier_id" onChange={updateFilter} value={filters.supplier_id}>
              <option value="">All suppliers</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="form-check mb-2">
              <input
                checked={filters.low_stock}
                className="form-check-input"
                id="low-stock-filter"
                name="low_stock"
                onChange={updateFilter}
                type="checkbox"
              />
              <label className="form-check-label" htmlFor="low-stock-filter">Low stock only</label>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-xl-3 d-flex gap-2">
            <Button className="flex-grow-1" type="submit">Apply filters</Button>
            <Button onClick={() => {
              const cleared = { search: '', category_id: '', supplier_id: '', low_stock: false }
              setFilters(cleared)
              setLoading(true)
              setAppliedFilters(cleared)
              setPage(1)
            }} variant="outline-secondary">
              Clear
            </Button>
          </div>
        </div>
      </form>

      <div className="card border-0 shadow-sm">
        <DataTable
          columns={columns}
          emptyMessage="No items match these filters."
          loading={loading || loadedPage !== page}
          rows={items}
          showEmptyState={!error && !loading && loadedPage === page}
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
            <Button form="item-form" loading={saving} type="submit">{editingItem ? 'Save changes' : 'Create item'}</Button>
          </div>
        )}
        onClose={() => setFormOpen(false)}
        open={formOpen}
        showCloseButton={!saving}
        size="lg"
        title={editingItem ? 'Edit item' : 'Add item'}
      >
        {optionsLoading && <Spinner label="Loading category and supplier choices..." size="sm" />}
        {optionsError && <Alert className="mb-3" variant="danger">{optionsError}</Alert>}
        {error && <Alert className="mb-3" variant="danger">{error}</Alert>}
        <form className="row g-3" id="item-form" noValidate onSubmit={handleSaveItem}>
          {itemFields.map((field) => (
            <div className={field.type === 'textarea' || field.name === 'image_path' ? 'col-12' : 'col-12 col-md-6'} key={field.name}>
              {field.name === 'category_id' || field.name === 'supplier_id' ? (
                <FormInput
                  disabled={optionsLoading || Boolean(optionsError)}
                  error={fieldErrors[field.name]}
                  label={field.label}
                  name={field.name}
                  onChange={updateItemField}
                  required
                  type="select"
                  value={itemValues[field.name]}
                >
                  <option value="">
                    {optionsLoading
                      ? 'Loading choices...'
                      : `Select ${field.label.toLowerCase()}`}
                  </option>
                  {(field.name === 'category_id' ? categories : suppliers).map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </FormInput>
              ) : (
                <FormInput
                  error={fieldErrors[field.name]}
                  label={field.label}
                  min={field.type === 'number' ? '0' : undefined}
                  name={field.name}
                  onChange={updateItemField}
                  required={field.required}
                  step={field.name === 'unit_price' ? '0.01' : field.type === 'number' ? '1' : undefined}
                  type={field.type || 'text'}
                  value={itemValues[field.name]}
                  maxLength={field.maxLength}
                  rows={field.rows}
                />
              )}
            </div>
          ))}
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Delete"
        loading={deleting}
        message={deleteItem
          ? `Delete "${deleteItem.name}"? Items with stock history cannot be deleted.`
          : 'Are you sure you want to continue?'}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
        open={Boolean(deleteItem)}
        title="Delete item"
      />

      <Modal
        closeOnBackdrop={!stockingOut}
        closeOnEscape={!stockingOut}
        footer={(
          <div className="d-flex justify-content-end gap-2">
            <Button disabled={stockingOut} onClick={() => setStockOutItem(null)} variant="secondary">Cancel</Button>
            <Button form="stock-out-form" loading={stockingOut} type="submit">Record stock-out</Button>
          </div>
        )}
        onClose={() => setStockOutItem(null)}
        open={Boolean(stockOutItem)}
        showCloseButton={!stockingOut}
        title={`Stock out${stockOutItem ? `: ${stockOutItem.name}` : ''}`}
      >
        {error && <Alert className="mb-3" variant="danger">{error}</Alert>}
        <p className="text-secondary">
          Available stock: {stockOutItem?.quantity ?? 0} {stockOutItem?.unit}
        </p>
        <form id="stock-out-form" noValidate onSubmit={handleStockOut}>
          <FormInput
            error={stockOutErrors.quantity}
            label="Quantity"
            min="1"
            name="quantity"
            onChange={(event) => {
              setStockOutValues((current) => ({ ...current, quantity: event.target.value }))
              setStockOutErrors((current) => ({ ...current, quantity: undefined }))
            }}
            required
            step="1"
            type="number"
            value={stockOutValues.quantity}
          />
          <FormInput
            label="Remarks"
            name="remarks"
            onChange={(event) => setStockOutValues((current) => ({ ...current, remarks: event.target.value }))}
            type="textarea"
            value={stockOutValues.remarks}
          />
        </form>
      </Modal>
    </section>
  )
}

export default ItemsPage
