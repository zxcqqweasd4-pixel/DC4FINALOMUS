function FormInput({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helpText,
  required = false,
  options = [],
  children,
  className = '',
  ...props
}) {
  const inputId = id || name
  const feedbackId = `${inputId}-feedback`
  const describedBy = [
    helpText && `${inputId}-help`,
    error && feedbackId,
  ].filter(Boolean).join(' ') || undefined
  const controlClassName = `form-control${error ? ' is-invalid' : ''}`

  return (
    <div className={`mb-3 ${className}`.trim()}>
      <label className="form-label" htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true" className="text-danger ms-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={`form-select${error ? ' is-invalid' : ''}`}
          id={inputId}
          name={name}
          onChange={onChange}
          required={required}
          value={value}
          {...props}
        >
          {children || options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={controlClassName}
          id={inputId}
          name={name}
          onChange={onChange}
          required={required}
          value={value}
          {...props}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={controlClassName}
          id={inputId}
          name={name}
          onChange={onChange}
          required={required}
          type={type}
          value={value}
          {...props}
        />
      )}
      {helpText && (
        <div className="form-text" id={`${inputId}-help`}>{helpText}</div>
      )}
      {error && (
        <div className="invalid-feedback" id={feedbackId}>{error}</div>
      )}
    </div>
  )
}

export default FormInput
