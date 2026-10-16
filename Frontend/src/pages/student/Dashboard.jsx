import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import {
  applicationStatuses,
  recommendedPartners,
  studentProfile,
} from '../../mockData.js'

const metrics = [
  { label: 'Applications', value: '08', note: '+2 this month', color: 'bg-teal-50 text-teal-800' },
  { label: 'Active projects', value: '03', note: '1 due this week', color: 'bg-blue-50 text-blue-800' },
  { label: 'Team members', value: '12', note: 'Across 4 teams', color: 'bg-violet-50 text-violet-800' },
  { label: 'Reviews', value: '4.9', note: 'From 12 projects', color: 'bg-amber-50 text-amber-800' },
]

function SectionTitle({ children, to, linkLabel = 'View all' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-slate-900">{children}</h2>
      {to && <Link to={to} className="text-xs font-semibold text-teal-700 hover:text-teal-900">{linkLabel}</Link>}
    </div>
  )
}

function PartnerRow({ partner }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-4 last:border-0 last:pb-0">
      <Avatar name={partner.name} size="sm" color={partner.color} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{partner.name}</p>
            <p className="truncate text-xs text-slate-500">{partner.title}</p>
          </div>
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800">
            {partner.match}% match
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {partner.skills.slice(0, 3).map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading
        eyebrow="Your workspace"
        title={`Good morning, ${studentProfile.name.split(' ')[0]}`}
        description="Here’s a snapshot of your progress and the people building alongside you."
        action={
          <Link to="/student/projects" className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
            Explore projects
          </Link>
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-3">
          <Card className="p-5">
            <SectionTitle>Overview</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-100 p-3">
                  <span className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${metric.color}`}>
                    {metric.value}
                  </span>
                  <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">{metric.label}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{metric.note}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle to="/student/profile">My skills</SectionTitle>
            <div className="space-y-4">
              {studentProfile.skills.map((skill) => (
                <ProgressBar key={skill.name} label={skill.name} value={skill.level} showValue />
              ))}
            </div>
            <Link to="/student/profile" className="mt-4 block text-xs font-semibold text-teal-700 hover:text-teal-900">
              Manage skills
            </Link>
          </Card>
        </div>

        <Card className="p-5 sm:p-6 xl:col-span-5">
          <SectionTitle to="/student/partners">Recommended partners</SectionTitle>
          <p className="-mt-2 mb-1 text-xs text-slate-500">People whose skills complement yours</p>
          {recommendedPartners.slice(0, 5).map((partner) => <PartnerRow key={partner.name} partner={partner} />)}
        </Card>

        <Card className="min-w-0 p-5 sm:p-6 xl:col-span-4">
          <SectionTitle to="/student/projects">Application status</SectionTitle>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-3">Project</th>
                  <th className="px-2 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicationStatuses.map((application) => (
                  <tr key={application.project}>
                    <td className="px-2 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{application.project}</p>
                      <p className="mt-1 text-xs text-slate-500">{application.client} · {application.updated}</p>
                    </td>
                    <td className="px-2 py-3.5"><Badge>{application.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/student/projects" className="mt-4 block text-xs font-semibold text-teal-700 hover:text-teal-900">
            Browse more projects
          </Link>
        </Card>
      </div>
    </div>
  )
}
