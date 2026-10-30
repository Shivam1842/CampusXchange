const avatarColors = [
  'bg-amber-100 text-amber-900',
  'bg-indigo-100 text-indigo-800',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-800',
  'bg-cyan-100 text-cyan-800',
  'bg-violet-100 text-violet-800',
]

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, src, size = 'md', color, className = '' }) {
  const sizeClass = {
    sm: 'size-9 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-16 text-lg',
    xl: 'size-24 text-2xl',
  }[size]
  const colorClass = color ?? avatarColors[name.length % avatarColors.length]

  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold ${sizeClass} ${colorClass} ${className}`}
      aria-label={`${name} avatar`}
    >
      {src ? <img src={src} alt="" className="size-full rounded-full object-cover" /> : getInitials(name)}
    </span>
  )
}
