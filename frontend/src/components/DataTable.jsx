import Spinner from './Spinner.jsx'

function DataTable({
  columns,
  rows,
  keyField = 'id',
  loading = false,
  emptyMessage = 'No records found.',
  className = '',
  showEmptyState = true,
}) {
  if (loading) {
    return <Spinner label="Loading records..." />
  }

  if (rows.length === 0) {
    if (!showEmptyState) return null

    return (
      <div className="alert alert-light border text-center text-secondary mb-0" role="status">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`table-responsive ${className}`.trim()}>
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[keyField] ?? index}>
              {columns.map((column) => (
                <td className={column.className} key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
