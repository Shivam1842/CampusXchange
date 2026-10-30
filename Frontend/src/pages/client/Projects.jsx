import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import { api } from '../../api.js'

export default function ClientProjects() {
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const selectedProject = projects.find((project) => project.id === selectedId)

  async function loadProjects() {
    try {
      const result = await api('/projects/mine?page=1&limit=50')
      setProjects(result.data.projects || [])
      setSelectedId((current) => current || result.data.projects?.[0]?.id || '')
    } catch (reason) {
      setError(reason.message)
    }
  }

  useEffect(() => { void Promise.resolve().then(loadProjects) }, [])

  async function saveProject(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    try {
      const result = await api(`/projects/${selectedId}`, {
        method: 'PATCH',
        body: {
          title: form.get('title').toString().trim(),
          description: form.get('description').toString().trim(),
          requirements: form.get('requirements').toString().split('\n').map((item) => item.trim()).filter(Boolean),
        },
      })
      setProjects((items) => items.map((item) => item.id === selectedId ? result.data.project : item))
    } catch (reason) {
      setError(reason.message)
    }
  }

  async function closeProject() {
    setError('')
    try {
      const result = await api(`/projects/${selectedId}/status`, { method: 'PATCH', body: { status: 'cancelled' } })
      setProjects((items) => items.map((item) => item.id === selectedId ? result.data.project : item))
    } catch (reason) {
      setError(reason.message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Client workspace" title="Manage projects" description="Edit project details, review applications, and close projects that are no longer accepting applicants." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {!projects.length ? <Card className="p-8 text-sm text-slate-500">You have not posted a project yet.</Card> : (
        <Card className="p-5 sm:p-7">
          <label className="block text-sm font-medium">Project<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2.5">{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
          {selectedProject && <>
            <div className="mt-4 flex items-center justify-between"><Badge>{selectedProject.status}</Badge><Link to="/client/applications" className="text-sm font-semibold text-teal-700">Review applications</Link></div>
            <form onSubmit={saveProject} className="mt-5 space-y-4">
              <label className="block text-sm">Title<input name="title" defaultValue={selectedProject.title} required minLength={5} className="mt-1 w-full rounded-lg border p-2.5"/></label>
              <label className="block text-sm">Description<textarea name="description" defaultValue={selectedProject.description} required minLength={20} rows={5} className="mt-1 w-full rounded-lg border p-2.5"/></label>
              <label className="block text-sm">Requirements — one per line<textarea name="requirements" defaultValue={(selectedProject.requirements || []).join('\n')} rows={4} className="mt-1 w-full rounded-lg border p-2.5"/></label>
              <div className="flex flex-wrap gap-2"><Button type="submit">Save changes</Button>{selectedProject.status === 'open' && <Button type="button" variant="danger" onClick={closeProject}>Close project</Button>}{['in_progress', 'under_review', 'completed'].includes(selectedProject.status) && <Link to={`/workspace/${selectedProject.id}`} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Open workspace</Link>}</div>
            </form>
          </>}
        </Card>
      )}
    </div>
  )
}
