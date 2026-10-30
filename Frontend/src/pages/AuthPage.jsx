import { useEffect, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, GraduationCap, LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { auth, saveSession } from '../api.js'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'client' || searchParams.get('role') === 'business' ? 'client' : 'student'
  const [role, setRole] = useState(defaultRole)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email').toString().trim()
    const password = form.get('password').toString()
    if (!email || password.length < 8) {
      setError('Enter a valid email address and a password with at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const payload = isRegister
        ? { name: form.get('name').toString().trim(), email, password, role }
        : { email, password }
      const result = isRegister ? await auth.register(payload) : await auth.login(payload)
      saveSession(result.data)
      const destination = {
        admin: '/admin/dashboard',
        client: '/client/post-project',
        student: '/student/dashboard',
      }[result.data.user.role] || '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function sendReset(event) {
    event.preventDefault(); setError(''); setForgotMessage('')
    try { const email = new FormData(event.currentTarget).get('resetEmail').toString().trim(); const result = await auth.forgotPassword(email); setForgotMessage(result.message) }
    catch (reason) { setError(reason.message) }
  }

  useEffect(() => {
    if (isRegister || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return undefined
    let script = document.querySelector('script[data-google-identity]')
    if (!script) { script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.dataset.googleIdentity = 'true'; document.head.appendChild(script) }
    const render = () => {
      const mount = document.getElementById('google-signin-button')
      if (!mount || !window.google?.accounts?.id) return
      window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: async ({ credential }) => { try { const result = await auth.google(credential, role); saveSession(result.data); navigate(role === 'client' ? '/client/post-project' : '/student/dashboard', { replace: true }) } catch (reason) { setError(reason.message) } } })
      window.google.accounts.id.renderButton(mount, { theme: 'outline', size: 'large', width: 400, text: 'continue_with' })
    }
    script.addEventListener('load', render); render()
    return () => script.removeEventListener('load', render)
  }, [isRegister, role, navigate])

  return (
    <div className="grid min-h-[calc(100vh-9rem)] bg-slate-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute -right-24 top-1/4 size-96 rounded-full bg-teal-500/10 blur-3xl" />
        <Link to="/" className="relative inline-flex items-center gap-2 text-sm font-semibold text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-600 font-bold">C</span>
          CampusXchange
        </Link>
        <div className="relative max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Make what’s next</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
            Skills grow faster when you build together.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Find thoughtful collaborators, work on real challenges, and turn what you’re learning into something you’re proud of.
          </p>
          <Card className="mt-8 border-white/10 bg-white/5 p-5 text-white">
            <div className="flex items-start gap-3">
              <Avatar name="Alex Morgan" size="sm" color="bg-amber-200 text-amber-950" />
              <div>
                <p className="text-sm leading-6 text-slate-200">“I found a team that challenged me and gave me a portfolio project I’m genuinely excited to share.”</p>
                <p className="mt-3 text-xs font-semibold text-teal-200">Alex Morgan · Student builder</p>
              </div>
            </div>
          </Card>
        </div>
        <p className="relative text-xs text-slate-400">A community for the next generation of builders.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 lg:hidden">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{isRegister ? 'Join the community' : 'Welcome back'}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{isRegister ? 'Create your account' : 'Sign in to CampusXchange'}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {isRegister ? 'Choose how you’ll use CampusXchange to get started.' : 'Pick up where your team left off.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1.5" role="group" aria-label="Choose account type">
            {[
              { id: 'student', label: 'Student', icon: GraduationCap },
              { id: 'client', label: 'Client / Business', icon: BriefcaseBusiness },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                aria-pressed={role === id}
                onClick={() => setRole(id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  role === id ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input id="full-name" name="name" type="text" autoComplete="name" required minLength={2} placeholder="Your name" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                {!isRegister && <button type="button" onClick={() => { setForgotOpen((open) => !open); setError('') }} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Forgot password?</button>}
              </div>
              <div className="relative">
                <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={8} placeholder="At least 8 characters" className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          {forgotOpen && <form onSubmit={sendReset} className="mt-3 space-y-2 rounded-xl border bg-white p-4"><label htmlFor="reset-email" className="text-sm font-medium">Send a reset link</label><input id="reset-email" name="resetEmail" type="email" required defaultValue="" placeholder="you@example.com" className="w-full rounded-lg border p-2 text-sm"/><Button type="submit" variant="secondary">Send reset email</Button>{forgotMessage && <p role="status" className="text-sm text-emerald-700">{forgotMessage}</p>}</form>}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-50 px-3 text-xs text-slate-400">or</span></div>
          </div>
          {!isRegister && (import.meta.env.VITE_GOOGLE_CLIENT_ID ? <div id="google-signin-button" className="flex justify-center" /> : <p className="rounded-lg border bg-white p-3 text-center text-xs text-slate-500">Google sign-in is available after VITE_GOOGLE_CLIENT_ID is configured.</p>)}
          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? 'Already have an account?' : 'New to CampusXchange?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-teal-700 hover:text-teal-900">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          {isRegister && (
            <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-xs leading-5 text-slate-400">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-600" />
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
