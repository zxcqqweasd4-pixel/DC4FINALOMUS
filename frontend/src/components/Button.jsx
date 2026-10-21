function Button({
  children,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  size,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="spinner-border spinner-border-sm me-2"
        />
      )}
      {children}
    </button>
  )
}

export default Button
