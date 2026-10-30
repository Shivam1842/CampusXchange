import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import ReportButton from '../../components/ReportButton.jsx'
import { api, getStoredUser, projectApi } from '../../api.js'

export default function ProjectDetails() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [teams, setTeams] = useState([])
  const [applicationType, setApplicationType] = useState('individual')
  const user = getStoredUser()

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) { setLoading(true); setError('') }
      return Promise.all([projectApi.get(id), api('/teams/mine')])
    }).then(([projectResult, teamResult]) => {
      if (active) {
        setProject(projectResult.data.project)
        setTeams(teamResult.data.teams || [])
      }
    }).catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function submitApplication(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await projectApi.apply(id, {
        type: form.get('type'),
        ...(form.get('type') === 'team' ? { team: form.get('team') } : {}),
        coverMessage: form.get('coverMessage').toString().trim(),
        skills: form.get('skills').toString().split(',').map((item) => item.trim()).filter(Boolean),
        portfolioLink: form.get('portfolioLink').toString().trim(),
        previousProjects: form.get('previousProjects').toString().split(',').map((item) => item.trim()).filter(Boolean),
        availability: form.get('availability').toString().trim(),
      })
      setSubmitted(true)
    } catch (requestError) { setError(requestError.message) }
  }

  if (loading) return <div className="px-4 py-16 text-center text-sm text-slate-500">Loading project…</div>
  if (!project) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-2xl font-bold text-slate-900">Project unavailable</h1><p role="alert" className="mt-2 text-sm text-slate-600">{error || 'This project may have been removed or is no longer available.'}</p><Link to="/student/projects" className="mt-5 inline-block text-sm font-semibold text-teal-700">Back to projects</Link></div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <Link to="/student/projects" className="mb-5 inline-flex text-sm font-semibold text-teal-700">← Browse projects</Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
              <div className="flex flex-wrap items-center gap-2"><Badge tone="bg-white/15 text-white ring-white/20">{project.category}</Badge>{project.client?.isVerified && <Badge tone="bg-emerald-300/15 text-emerald-100 ring-emerald-200/20">Verified client</Badge>}</div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{project.title}</h1>
              <p className="mt-2 text-sm text-teal-50">{project.client?.name} · {project.duration}</p>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8"><div><p className="text-xs text-slate-400">Budget</p><p className="mt-1 text-sm font-bold text-slate-900">{project.budget || 'Not specified'}</p></div><div><p className="text-xs text-slate-400">Application deadline</p><p className="mt-1 text-sm font-bold text-slate-900">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Flexible'}</p></div><div><p className="text-xs text-slate-400">Students needed</p><p className="mt-1 text-sm font-bold text-slate-900">{project.studentsRequired} collaborators</p></div></div>
          </Card>
          <Card className="p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">About this project</h2><ReportButton targetType="project" targetId={project.id}/></div><p className="mt-3 text-sm leading-7 text-slate-600">{project.description}</p><h3 className="mt-7 text-sm font-bold text-slate-900">Required skills</h3><div className="mt-3 flex flex-wrap gap-2">{(project.skills || []).map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div><h3 className="mt-7 text-sm font-bold text-slate-900">What you’ll work on</h3><ul className="mt-3 space-y-3">{(project.requirements || []).map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />{item}</li>)}</ul></Card>
        </div>
        <Card className="p-5 sm:p-6 lg:sticky lg:top-6"><h2 className="text-lg font-bold text-slate-900">Apply to this project</h2><p className="mt-1 text-sm text-slate-500">Tell the client how you can contribute.</p>
          {submitted ? <div role="status" className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5"><p className="font-semibold text-emerald-900">Application submitted</p><p className="mt-1 text-sm text-emerald-800">Your application was saved. You can track its status from your dashboard.</p><Link to="/student/dashboard" className="mt-3 inline-block text-sm font-semibold underline">Go to dashboard</Link></div> : <form onSubmit={submitApplication} className="mt-5 space-y-4">
            <fieldset><legend className="mb-2 text-sm font-medium text-slate-700">Apply as</legend><div className="grid grid-cols-2 gap-2"><label className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-medium text-teal-900"><input type="radio" name="type" value="individual" checked={applicationType === 'individual'} onChange={() => setApplicationType('individual')} className="accent-teal-700" />Individual</label><label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="radio" name="type" value="team" checked={applicationType === 'team'} onChange={() => setApplicationType('team')} className="accent-teal-700" />As a team</label></div>{applicationType === 'team' && <label className="mt-3 block text-sm text-slate-700">Choose your team<select name="team" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select a team</option>{teams.filter((team) => team.owner?.id === user?.id && ['forming', 'active'].includes(team.status)).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>}</fieldset>
            <div><label htmlFor="cover-message" className="mb-1.5 block text-sm font-medium text-slate-700">Cover message</label><textarea id="cover-message" name="coverMessage" required minLength={20} maxLength={3000} rows={5} className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" /><p className="mt-1 text-xs text-slate-400">At least 20 characters.</p></div>
            <div><label htmlFor="application-skills" className="mb-1.5 block text-sm font-medium text-slate-700">Relevant skills (comma separated)</label><input id="application-skills" name="skills" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
            <div><label htmlFor="portfolio-link" className="mb-1.5 block text-sm font-medium text-slate-700">Portfolio or relevant link (optional)</label><input id="portfolio-link" name="portfolioLink" type="url" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
            <div><label htmlFor="previous-projects" className="mb-1.5 block text-sm font-medium text-slate-700">Previous projects (comma separated)</label><input id="previous-projects" name="previousProjects" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
            <div><label htmlFor="application-availability" className="mb-1.5 block text-sm font-medium text-slate-700">Availability</label><input id="application-availability" name="availability" maxLength={80} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<Button type="submit" size="lg" className="w-full">Submit application</Button>
          </form>}
        </Card>
      </div>
    </div>
  )
}
