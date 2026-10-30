import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import ReviewForm from '../../components/ReviewForm.jsx'
import { api } from '../../api.js'

const label = (status) => (status || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [error, setError] = useState('')

  async function loadApplications() {
    try {
      const result = await api('/applications/mine?page=1&limit=50')
      setApplications(result.data.applications || [])
    } catch (reason) {
      setError(reason.message)
    }
  }

  useEffect(() => { void Promise.resolve().then(loadApplications) }, [])

  async function withdraw(application) {
    setError('')
    try {
      await api(`/applications/${application.id}/withdraw`, { method: 'PATCH' })
      await loadApplications()
    } catch (reason) {
      setError(reason.message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Student workspace" title="My applications" description="Track decisions and open the workspace for projects where you have been selected." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="space-y-3">
        {applications.map((application) => (
          <Card key={application.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="font-bold">{application.project?.title || 'Project'}</h2>
              <p className="mt-1 text-sm text-slate-500">{application.project?.client || 'Client'} · Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}</p>
              {application.type === 'team' && application.team?.name && <p className="mt-1 text-sm text-slate-500">Team: {application.team.name}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge>{label(application.status)}</Badge>
              {application.status === 'selected' && application.project?.id && <Link to={`/workspace/${application.project.id}`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Open workspace</Link>}
              {['applied', 'under_review', 'shortlisted'].includes(application.status) && <Button size="sm" variant="danger" onClick={() => withdraw(application)}>Withdraw</Button>}
            </div>
            {application.status === 'selected' && application.project?.status === 'completed' && application.project.clientId && <ReviewForm projectId={application.project.id} revieweeId={application.project.clientId} revieweeName={application.project.client || 'Client'} />}
          </Card>
        ))}
        {!applications.length && <Card className="p-8 text-center text-sm text-slate-500">You have not applied to any projects yet. <Link className="font-semibold text-teal-700" to="/student/projects">Browse projects</Link></Card>}
      </div>
    </div>
  )
}
