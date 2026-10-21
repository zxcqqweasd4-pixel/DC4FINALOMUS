function Alert({ children, variant = 'info', onDismiss, className = '' }) {
  return (
    <div
      className={`alert alert-${variant} ${className}`.trim()}
      role={variant === 'danger' ? 'alert' : 'status'}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>{children}</div>
        {onDismiss && (
          <button
            aria-label="Dismiss message"
            className="btn-close"
            onClick={onDismiss}
            type="button"
          />
        )}
      </div>
    </div>
  )
}

export default Alert
