import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { projectApi } from '../../api.js'

const projectCategories = ['All categories']

function ProjectCard({ project }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-teal-700">{project.category}</p>
          <Link to={`/student/projects/${project.id}`} className="mt-1 block text-base font-bold text-slate-900 hover:text-teal-800">
            {project.title}
          </Link>
        </div>
        <Badge>{project.status}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-6 text-slate-600">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(project.skills || []).map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Client</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-700">{project.client?.businessName || project.client?.name || 'Client'}</p>
            {project.client?.isVerified && <Badge tone="bg-emerald-50 text-emerald-800">Verified</Badge>}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Flexible'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Duration</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{project.duration}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Budget</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{project.budget}</p>
          </div>
        </div>
        <Link
          to={`/student/projects/${project.id}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          View project
        </Link>
      </div>
    </Card>
  )
}

export default function Projects() {
  const [category, setCategory] = useState('All categories')
  const [skill, setSkill] = useState('Any skill')
  const [deadline, setDeadline] = useState('Any deadline')
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const allSkills = useMemo(() => [...new Set(projects.flatMap((project) => project.skills || []))].sort(), [projects])
  const categories = useMemo(() => [...projectCategories, ...new Set(projects.map((item) => item.category).filter(Boolean))], [projects])
  useEffect(() => {
    const params = { page: '1', limit: '50' }
    if (category !== 'All categories') params.category = category
    if (skill !== 'Any skill') params.skill = skill
    if (query.trim()) params.q = query.trim()
    if (deadline === 'Next 30 days') {
      const date = new Date(); date.setDate(date.getDate() + 30)
      params.deadlineBefore = date.toISOString()
    }
    let active = true
    void Promise.resolve().then(() => {
      if (active) { setLoading(true); setError('') }
      return projectApi.list(params)
    }).then((result) => { if (active) setProjects(result.data.projects || []) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category, deadline, query, skill])
  const filteredProjects = projects

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Find your next challenge" title="Browse projects" description="Work on real projects, build your portfolio, and learn with a team." />
      <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="p-4">
          <h2 className="px-2 text-sm font-bold text-slate-900">Categories</h2>
          <nav className="mt-3 space-y-1" aria-label="Project categories">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  category === item ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item}</span>
                {category === item && <span className="size-1.5 rounded-full bg-teal-700" />}
              </button>
            ))}
          </nav>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Your skills</p>
            <div className="mt-3 flex flex-wrap gap-1.5 px-1">
              {allSkills.slice(0, 6).map((item) => <SkillTag key={item} variant="teal">{item}</SkillTag>)}
            </div>
          </div>
        </Card>

        <div className="min-w-0">
          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(200px,1fr)_180px_160px]">
            <label>
              <span className="sr-only">Search projects</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects or skills..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label>
              <span className="sr-only">Filter by skill</span>
              <select value={skill} onChange={(event) => setSkill(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                <option>Any skill</option>
                {allSkills.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by deadline</span>
              <select value={deadline} onChange={(event) => setDeadline(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                <option>Any deadline</option>
                <option>Next 30 days</option>
              </select>
            </label>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">{filteredProjects.length}</span> open projects</p>
            <span className="text-xs text-slate-400">Sorted by best match</span>
          </div>
          {loading ? <Card className="p-10 text-center text-sm text-slate-500">Loading projects…</Card> : error ? <Card className="p-8 text-center text-sm text-rose-700" role="alert">{error}</Card> : filteredProjects.length ? (
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <Card className="px-6 py-14 text-center">
              <h2 className="font-semibold text-slate-900">No projects match these filters</h2>
              <p className="mt-2 text-sm text-slate-500">Try another category, skill, or search term.</p>
              <button type="button" onClick={() => { setCategory('All categories'); setSkill('Any skill'); setDeadline('Any deadline'); setQuery('') }} className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900">Clear filters</button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
