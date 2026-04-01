function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase()
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'
  const statusClass = normalized === 'paid'
    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    : normalized === 'pending'
      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'

  return (
    <span className={`${base} ${statusClass}`}>
      {status}
    </span>
  )
}

export default StatusBadge
