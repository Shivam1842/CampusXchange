import { ArrowRight, BriefcaseBusiness, Check, Code2, GraduationCap, Lightbulb, Sparkles, Users, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'

const steps = [
  { number: '01', title: 'Create your profile', text: 'Share your strengths, interests, and the skills you want to grow.', icon: GraduationCap },
  { number: '02', title: 'Find your people', text: 'Meet students and businesses with complementary ideas and skills.', icon: Users },
  { number: '03', title: 'Build a team', text: 'Bring the right mix of collaborators together around a real challenge.', icon: Lightbulb },
  { number: '04', title: 'Make it real', text: 'Work on meaningful projects, learn by doing, and show what you can do.', icon: Code2 },
]

const statistics = [
  { value: '12k+', label: 'Student builders' },
  { value: '1,200+', label: 'Partner businesses' },
  { value: '3,800+', label: 'Projects launched' },
  { value: '92%', label: 'Would collaborate again' },
]

export default function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white">
        <div className="absolute -right-40 -top-40 -z-10 size-[34rem] rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute -bottom-56 left-1/4 -z-10 size-[30rem] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-teal-100">
              <Sparkles size={14} /> Your next big idea starts here
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Learn. Connect.
              <span className="block text-teal-300">Collaborate. Build.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Turn your skills into real-world experience. Find your people, join meaningful projects, and build things that make a difference.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register?role=student" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 sm:w-auto">
                <GraduationCap size={18} /> I am a Student <ArrowRight size={16} />
              </Link>
              <Link to="/register?role=business" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
                <BriefcaseBusiness size={18} /> I am a Business
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-teal-300" /> Free to join</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-teal-300" /> Verified community</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-teal-300" /> Real projects, real experience</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-teal-500/20 to-blue-500/20 blur-2xl" />
            <Card className="relative overflow-hidden border-white/10 bg-white p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Project spotlight</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Campus Connect</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Open team spots</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">Build a welcoming platform to help new students discover campus communities.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Product design', 'React', 'Community'].map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{tag}</span>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Your collaboration circle</span>
                  <span className="text-teal-700">4 skills matched</span>
                </div>
                <div className="mt-4 flex items-center">
                  {[
                    ['AM', 'bg-amber-100 text-amber-900'],
                    ['JL', 'bg-indigo-100 text-indigo-800'],
                    ['SR', 'bg-rose-100 text-rose-800'],
                    ['TK', 'bg-cyan-100 text-cyan-800'],
                  ].map(([initials, style]) => (
                    <span key={initials} className={`-ml-2 grid size-10 place-items-center rounded-full border-2 border-white text-xs font-bold first:ml-0 ${style}`}>{initials}</span>
                  ))}
                  <span className="ml-3 text-xs text-slate-500">Designers, developers &amp; dreamers</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="grid size-7 place-items-center rounded-lg bg-teal-50 text-teal-800"><WandSparkles size={15} /></span>
                  Better together, by design
                </div>
                <Link to="/student/projects/campus-connect" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
                  Explore <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Good things happen when skills connect</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">A simple path from what you know to what you can build next.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, text, icon: Icon }) => (
            <Card key={number} className="relative p-5 transition-transform hover:-translate-y-1 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-teal-700">{number}</span>
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-800"><Icon size={19} /></span>
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="about" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {statistics.map((statistic) => (
            <div key={statistic.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{statistic.value}</p>
              <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">{statistic.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your next collaboration starts here.</h2>
        <p className="mt-3 text-sm text-slate-600">Bring your curiosity. We’ll help you find the right people to build with.</p>
        <Link to="/register" className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
          Create your free account <ArrowRight size={16} />
        </Link>
      </section>
    </>
  )
}
