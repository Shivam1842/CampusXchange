export default function ProgressBar({
  value,
  label,
  showValue = false,
  color = 'bg-teal-600',
  className = '',
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showValue && <span className="font-semibold text-slate-500">{safeValue}%</span>}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label ?? 'Progress'}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}
