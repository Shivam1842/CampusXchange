export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-600',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
    navy: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700',
    subtle: 'bg-teal-50 text-teal-800 hover:bg-teal-100 focus-visible:ring-teal-600',
    danger: 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-500',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
