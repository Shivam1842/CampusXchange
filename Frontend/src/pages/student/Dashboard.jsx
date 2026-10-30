import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { api } from '../../api.js'

function SectionTitle({ children, to }) { return <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">{children}</h2>{to && <Link to={to} className="text-xs font-semibold text-teal-700">View all</Link>}</div> }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/dashboard/student').then((result) => setData(result.data)).catch((reason) => setError(reason.message)) }, [])
  const metrics = data?.metrics || {}
  const items = [
    ['Applications', metrics.applications ?? '—', 'Submitted applications', 'bg-teal-50 text-teal-800'],
    ['Active projects', metrics.activeProjects ?? '—', 'Selected projects in progress', 'bg-blue-50 text-blue-800'],
    ['Team memberships', metrics.teamMembers ?? '—', 'Teams you belong to', 'bg-violet-50 text-violet-800'],
    ['Reviews', metrics.rating ?? '—', metrics.reviews == null ? 'No reviews yet' : `${metrics.reviews} reviews`, 'bg-amber-50 text-amber-800'],
  ]
  return <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
    <PageHeading eyebrow="Your workspace" title={`Good morning${data?.name ? `, ${data.name.split(' ')[0]}` : ''}`} description="Here’s a snapshot of your progress and the people building alongside you." action={<Link to="/student/projects" className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Explore projects</Link>} />
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!data && !error ? <Card className="p-8 text-sm text-slate-500">Loading dashboard…</Card> : <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-3"><Card className="p-5"><SectionTitle>Overview</SectionTitle><div className="grid grid-cols-2 gap-3">{items.map(([label, value, note, color]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><span className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${color}`}>{value}</span><p className="mt-3 text-xl font-bold">{value}</p><p className="mt-0.5 text-xs text-slate-600">{label}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div>)}</div></Card>
        <Card className="p-5"><SectionTitle to="/student/profile">My skills</SectionTitle><div className="space-y-4">{(data?.skills || []).map((skill) => <ProgressBar key={skill.name} label={skill.name} value={skill.proficiency ?? 0} showValue />)}{!data?.skills?.length && <p className="text-sm text-slate-500">Add skills to your profile.</p>}</div></Card></div>
      <Card className="p-5 sm:p-6 xl:col-span-5"><SectionTitle to="/student/partners">Recommended partners</SectionTitle><p className="-mt-2 mb-1 text-xs text-slate-500">People whose skills complement yours</p>{(data?.partners || []).map((partner) => <div key={partner.id} className="flex gap-3 border-b border-slate-100 py-4 last:border-0"><Avatar name={partner.name} size="sm" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><p className="truncate text-sm font-semibold">{partner.name}</p><p className="truncate text-xs text-slate-500">{partner.title}</p></div><span className="text-xs font-bold text-teal-800">{partner.match == null ? '—' : `${partner.match}%`}</span></div><div className="mt-2 flex flex-wrap gap-1.5">{partner.skills.slice(0, 3).map((skill) => <SkillTag key={skill.name || skill}>{skill.name || skill}</SkillTag>)}</div></div></div>)}{!data?.partners?.length && <p className="py-4 text-sm text-slate-500">No partner suggestions yet.</p>}</Card>
      <Card className="min-w-0 p-5 sm:p-6 xl:col-span-4"><SectionTitle to="/student/applications">Application status</SectionTitle><div className="overflow-x-auto"><table className="w-full min-w-[360px] text-left"><thead><tr className="border-b text-[11px] uppercase text-slate-400"><th className="px-2 py-3">Project</th><th className="px-2 py-3">Status</th></tr></thead><tbody className="divide-y">{(data?.applications || []).map((application) => <tr key={application.id}><td className="px-2 py-3.5"><p className="text-sm font-semibold">{application.project.title}</p><p className="mt-1 text-xs text-slate-500">{application.client}</p>{application.status === 'selected' && ['in_progress', 'under_review', 'completed'].includes(application.project.status) && <Link to={`/workspace/${application.project.id}`} className="mt-1 inline-block text-xs font-semibold text-teal-700">Open workspace</Link>}</td><td className="px-2 py-3.5"><Badge>{application.status}</Badge></td></tr>)}</tbody></table></div>{!data?.applications?.length && <p className="py-4 text-sm text-slate-500">You haven’t applied to a project yet.</p>}</Card>
    </div>}
  </div>
}
