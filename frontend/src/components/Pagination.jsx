function getVisiblePages(currentPage, lastPage) {
  const firstPage = Math.max(1, Math.min(currentPage - 2, lastPage - 4))
  const finalPage = Math.min(lastPage, firstPage + 4)

  return Array.from(
    { length: finalPage - firstPage + 1 },
    (_, index) => firstPage + index,
  )
}

function Pagination({
  currentPage,
  lastPage,
  onPageChange,
  total,
  from,
  to,
}) {
  if (!lastPage || lastPage <= 1) {
    return null
  }

  const pages = getVisiblePages(currentPage, lastPage)

  return (
    <nav
      aria-label="Pagination"
      className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3"
    >
      {typeof total === 'number' && (
        <p className="small text-secondary mb-0">
          Showing {from ?? 0}–{to ?? 0} of {total}
        </p>
      )}
      <ul className="pagination mb-0">
        <li className={`page-item${currentPage <= 1 ? ' disabled' : ''}`}>
          <button
            aria-label="Go to previous page"
            className="page-link"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
        </li>
        {pages.map((page) => (
          <li className={`page-item${page === currentPage ? ' active' : ''}`} key={page}>
            <button
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Go to page ${page}`}
              className="page-link"
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          </li>
        ))}
        <li className={`page-item${currentPage >= lastPage ? ' disabled' : ''}`}>
          <button
            aria-label="Go to next page"
            className="page-link"
            disabled={currentPage >= lastPage}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}

export default Pagination
