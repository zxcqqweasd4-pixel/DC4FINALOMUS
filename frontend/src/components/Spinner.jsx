function Spinner({ label = 'Loading...', size = 'md', className = '' }) {
  const spinnerSize = size === 'sm' ? 'spinner-border-sm' : ''

  return (
    <div
      aria-label={label}
      className={`d-flex align-items-center justify-content-center gap-2 py-4 ${className}`.trim()}
      role="status"
    >
      <span aria-hidden="true" className={`spinner-border text-primary ${spinnerSize}`} />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}

export default Spinner
