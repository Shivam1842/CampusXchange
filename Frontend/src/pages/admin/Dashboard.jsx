import { useState } from 'react'
import { Activity, Building2, BriefcaseBusiness, Check, ClipboardCheck, UserRound, Users } from 'lucide-react'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import { adminMetrics, adminReports } from '../../mockData.js'

const metricIcons = { users: Users, building: Building2, briefcase: BriefcaseBusiness, activity: Activity }
const chartData = [
  { label: 'May', value: 39 },
  { label: 'Jun', value: 56 },
  { label: 'Jul', value: 46 },
  { label: 'Aug', value: 72 },
  { label: 'Sep', value: 63 },
  { label: 'Oct', value: 88 },
]

export default function AdminDashboard() {
  const [items, setItems] = useState(adminReports)
  const [reviewed, setReviewed] = useState([])
  const [activeSection, setActiveSection] = useState('Overview')

  function reviewItem(id) {
    setReviewed((current) => current.includes(id) ? current : [...current, id])
  }

  function dismissItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Platform overview" title="Admin dashboard" description="Monitor the community, projects, and requests that need attention." />
      <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200" aria-label="Admin dashboard sections">
        {['Overview', 'Users', 'Projects', 'Reports', 'Verification'].map((section) => (
          <a
            key={section}
            href={`#${section.toLowerCase()}`}
            onClick={() => setActiveSection(section)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeSection === section ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {section}
          </a>
        ))}
      </nav>

      <div id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => {
          const Icon = metricIcons[metric.icon]
          const sectionId = metric.label === 'Total students' ? 'users' : metric.label === 'Projects' ? 'projects' : undefined
          return (
            <Card key={metric.label} id={sectionId} className="p-5">
              <div className="flex items-start justify-between">
                <span className={`grid size-10 place-items-center rounded-xl ${metric.color}`}><Icon size={19} /></span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{metric.change}</span>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">User registrations</h2><p className="mt-1 text-xs text-slate-500">New community members over the last six months</p></div>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Last 6 months</span>
          </div>
          <div className="mt-7 flex h-56 items-end justify-between gap-3 border-b border-l border-slate-200 px-4 pb-0 pt-3">
            {chartData.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-medium text-slate-400">{item.value * 31}</span>
                <div className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-teal-700 to-teal-500 transition-opacity hover:opacity-80" style={{ height: `${item.value}%` }} title={`${item.value * 31} new registrations`} />
                <span className="mb-2 text-[11px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><span className="size-2.5 rounded-sm bg-teal-600" /> New registrations</div>
        </Card>

        <div id="reports">
          <Card id="verification" className="h-full overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div><h2 className="font-bold text-slate-900">Pending verification &amp; reports</h2><p className="mt-1 text-xs text-slate-500">Review these items to keep the community trusted.</p></div>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-800"><ClipboardCheck size={18} /></span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.length ? items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.item}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={reviewed.includes(item.id) ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/15' : item.type.includes('verification') ? 'bg-blue-50 text-blue-800 ring-blue-600/15' : 'bg-amber-50 text-amber-800 ring-amber-600/15'}>{reviewed.includes(item.id) ? 'Reviewed' : item.type}</Badge>
                      <span className="text-[11px] text-slate-400">{item.submitted}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" disabled={reviewed.includes(item.id)} onClick={() => reviewItem(item.id)}>
                      <Check size={13} /> {reviewed.includes(item.id) ? 'Reviewed' : 'Review'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => dismissItem(item.id)}>Dismiss</Button>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-12 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check size={20} /></span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">You’re all caught up</p>
                  <p className="mt-1 text-xs text-slate-500">New reports and verification requests will appear here.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:px-6">
              <span>{items.filter((item) => !reviewed.includes(item.id)).length} items need attention</span>
              <span className="inline-flex items-center gap-1"><UserRound size={13} /> Admin review queue</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
