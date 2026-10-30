import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { auth } from '../api.js'
import Button from '../components/Button.jsx'

export default function AuthAction({ action }) {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (action !== 'verify') return
    const token = params.get('token')
    if (!token) { Promise.resolve().then(() => setError('The verification link is incomplete.')); return }
    auth.verifyEmail(token).then((result) => setMessage(result.message)).catch((reason) => setError(reason.message))
  }, [action, params])
  async function reset(event) { event.preventDefault(); setError(''); const data = new FormData(event.currentTarget); const password = data.get('password').toString(); if (password !== data.get('confirm').toString()) { setError('The passwords do not match.'); return } try { const result = await auth.resetPassword(params.get('token'), password); setMessage(result.message) } catch (reason) { setError(reason.message) } }
  return <main className="mx-auto max-w-lg px-4 py-16"><section className="rounded-2xl border bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">{action === 'verify' ? 'Email verification' : 'Choose a new password'}</h1>{action === 'verify' ? <p className="mt-4 text-sm text-slate-600">{message || error || 'Verifying your email…'}</p> : <form onSubmit={reset} className="mt-5 space-y-3"><label className="block text-sm">New password<input name="password" type="password" required minLength={8} maxLength={128} className="mt-1 w-full rounded-lg border p-2"/></label><label className="block text-sm">Confirm password<input name="confirm" type="password" required minLength={8} className="mt-1 w-full rounded-lg border p-2"/></label><Button type="submit">Reset password</Button>{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</form>}<Link to="/login" className="mt-5 inline-block text-sm font-semibold text-teal-700">Return to sign in</Link></section></main>
}
