const statusStyles = {
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-600/15',
  'Under Review': 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Shortlisted: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  Submitted: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  Open: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Verified: 'bg-teal-50 text-teal-800 ring-teal-600/15',
  Accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
}

export default function Badge({ children, tone, className = '' }) {
  const formatted = typeof children === 'string' && (/^[a-z]+(?:_[a-z]+)*$/.test(children) || children === 'Open')
    ? children.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : children
  const style = tone ?? statusStyles[formatted] ?? 'bg-slate-100 text-slate-700 ring-slate-500/15'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}>
      {formatted}
    </span>
  )
}
