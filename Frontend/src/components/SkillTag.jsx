export default function SkillTag({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-800',
    navy: 'bg-blue-50 text-blue-800',
  }

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
