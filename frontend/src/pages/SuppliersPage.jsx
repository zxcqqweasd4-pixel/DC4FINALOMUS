import ResourceManagementPage from '../components/ResourceManagementPage.jsx'

const fields = [
  { name: 'name', label: 'Supplier name', required: true, maxLength: 255 },
  { name: 'contact_person', label: 'Contact person', maxLength: 255 },
  { name: 'phone', label: 'Phone', maxLength: 50 },
  { name: 'email', label: 'Email', type: 'email', maxLength: 255 },
  { name: 'address', label: 'Address', type: 'textarea', rows: 3 },
]

const columns = [
  { key: 'name', label: 'Supplier' },
  {
    key: 'contact_person',
    label: 'Contact',
    render: (supplier) => supplier.contact_person || <span className="text-secondary">—</span>,
  },
  {
    key: 'phone',
    label: 'Phone',
    render: (supplier) => supplier.phone || <span className="text-secondary">—</span>,
  },
  {
    key: 'email',
    label: 'Email',
    render: (supplier) => supplier.email || <span className="text-secondary">—</span>,
  },
]

function SuppliersPage() {
  return (
    <ResourceManagementPage
      columns={columns}
      emptyMessage="No suppliers yet. Add a supplier to connect it to inventory items."
      endpoint="/suppliers"
      fields={fields}
      singularTitle="Supplier"
      title="Suppliers"
    />
  )
}

export default SuppliersPage
