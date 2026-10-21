const statusVariants = {
  approved: 'primary',
  completed: 'success',
  in: 'success',
  out: 'warning',
  pending: 'warning',
  rejected: 'danger',
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'unknown').toLowerCase()
  const variant = statusVariants[normalizedStatus] || 'secondary'
  const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)

  return <span className={`badge text-bg-${variant}`}>{label}</span>
}

export default StatusBadge
