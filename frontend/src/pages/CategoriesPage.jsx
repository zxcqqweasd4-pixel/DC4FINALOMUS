import ResourceManagementPage from '../components/ResourceManagementPage.jsx'

const fields = [
  { name: 'name', label: 'Category name', required: true, maxLength: 255 },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
]

const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'description',
    label: 'Description',
    render: (category) => category.description || <span className="text-secondary">—</span>,
  },
]

function CategoriesPage() {
  return (
    <ResourceManagementPage
      columns={columns}
      emptyMessage="No categories yet. Add one to start organizing inventory."
      endpoint="/categories"
      fields={fields}
      singularTitle="Category"
      title="Categories"
    />
  )
}

export default CategoriesPage
