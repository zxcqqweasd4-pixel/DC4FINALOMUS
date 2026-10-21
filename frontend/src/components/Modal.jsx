import { useEffect, useId } from 'react'

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (closeOnEscape && event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose, closeOnEscape])

  if (!open) return null

  return (
    <div
      className="app-modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`app-modal-dialog app-modal-${size}`}
        role="dialog"
      >
        <div className="app-modal-content">
          <header className="app-modal-header">
            <h2 className="h5 mb-0" id={titleId}>{title}</h2>
            {showCloseButton && (
              <button
                aria-label="Close dialog"
                className="btn-close"
                onClick={onClose}
                type="button"
              />
            )}
          </header>
          <div className="app-modal-body">{children}</div>
          {footer && <footer className="app-modal-footer">{footer}</footer>}
        </div>
      </section>
    </div>
  )
}

export default Modal
