import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-teal-700">404 · Page not found</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Looks like you took a wrong turn.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">The page may have moved or the address may be incorrect.</p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Return home</Link>
    </section>
  )
}
