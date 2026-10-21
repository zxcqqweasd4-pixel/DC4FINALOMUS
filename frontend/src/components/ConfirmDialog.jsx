import Button from './Button.jsx'
import Modal from './Modal.jsx'

function ConfirmDialog({
  open,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      footer={(
        <div className="d-flex justify-content-end gap-2">
          <Button disabled={loading} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button loading={loading} onClick={onConfirm} variant={confirmVariant}>
            {confirmLabel}
          </Button>
        </div>
      )}
      onClose={onCancel}
      open={open}
      size="sm"
      showCloseButton={!loading}
      title={title}
    >
      <p className="mb-0">{message}</p>
    </Modal>
  )
}

export default ConfirmDialog
