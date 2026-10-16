import { useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, Clock3, DollarSign, Users } from 'lucide-react'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { businessProfile } from '../../mockData.js'

const initialProject = {
  title: '',
  description: '',
  category: 'Web',
  duration: '4-6 weeks',
  skills: '',
  studentsRequired: '2',
  deadline: '',
  budget: '',
}

export default function PostProject() {
  const [project, setProject] = useState(initialProject)
  const [notice, setNotice] = useState('')
  const skills = useMemo(
    () => project.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    [project.skills],
  )

  function updateField(event) {
    const { name, value } = event.target
    setProject((current) => ({ ...current, [name]: value }))
    setNotice('')
  }

  function submitProject(event) {
    event.preventDefault()
    setNotice('Your project details are ready for review. Publishing will be available when your client account is connected.')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Client workspace" title="Post a project" description="Share a real challenge and meet the students ready to build it with you." />
      {notice && (
        <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">Project details</h2>
          <p className="mt-1 text-sm text-slate-500">Clear project details help students decide if they’re a good fit.</p>
          <form onSubmit={submitProject} className="mt-6 space-y-5">
            <div>
              <label htmlFor="project-title" className="mb-1.5 block text-sm font-medium text-slate-700">Project title</label>
              <input id="project-title" name="title" value={project.title} onChange={updateField} required maxLength={100} placeholder="e.g. Campus Connect student platform" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            </div>
            <div>
              <label htmlFor="project-description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea id="project-description" name="description" value={project.description} onChange={updateField} required minLength={30} maxLength={1500} rows={5} placeholder="Describe the challenge, your goals, and what the team will create..." className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              <p className="mt-1 text-right text-xs text-slate-400">{project.description.length}/1500</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="project-category" className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select id="project-category" name="category" value={project.category} onChange={updateField} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  {['Web', 'Mobile', 'Design', 'Data / AI'].map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="project-duration" className="mb-1.5 block text-sm font-medium text-slate-700">Estimated duration</label>
                <select id="project-duration" name="duration" value={project.duration} onChange={updateField} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                  {['1-2 weeks', '2-4 weeks', '4-6 weeks', '6-8 weeks', '8+ weeks'].map((duration) => <option key={duration}>{duration}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="project-skills" className="mb-1.5 block text-sm font-medium text-slate-700">Required skills</label>
              <input id="project-skills" name="skills" value={project.skills} onChange={updateField} placeholder="React, UI/UX, User research" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              <p className="mt-1 text-xs text-slate-400">Enter skills separated by commas.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="students-required" className="mb-1.5 block text-sm font-medium text-slate-700">Students required</label>
                <input id="students-required" name="studentsRequired" type="number" min="1" max="20" value={project.studentsRequired} onChange={updateField} required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label htmlFor="project-deadline" className="mb-1.5 block text-sm font-medium text-slate-700">Application deadline</label>
                <input id="project-deadline" name="deadline" type="date" value={project.deadline} onChange={updateField} required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label htmlFor="project-budget" className="mb-1.5 block text-sm font-medium text-slate-700">Budget</label>
                <input id="project-budget" name="budget" type="text" value={project.budget} onChange={updateField} required placeholder="$500 - $1,000" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setNotice('Draft saved in this session. Your details remain in the form for editing.')}>Save draft</Button>
              <Button type="submit">Submit project for review</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-teal-800 to-slate-900 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Live preview</p>
              <h2 className="mt-3 break-words text-xl font-bold">{project.title || 'Your project title'}</h2>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-200">
                <span>{project.category}</span><span>·</span><span>{project.duration}</span>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-800">{businessProfile.initials}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{businessProfile.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    {businessProfile.verified && <><BadgeCheck size={13} className="text-teal-700" /> Verified client · </>}{businessProfile.industry}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">{project.description || 'Your project description will appear here as you write it.'}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.length ? skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>) : <span className="text-xs text-slate-400">Required skills will show here.</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2"><Clock3 size={15} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Duration</p><p className="mt-0.5 text-xs font-semibold text-slate-700">{project.duration}</p></div></div>
                <div className="flex items-start gap-2"><Users size={15} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Open spots</p><p className="mt-0.5 text-xs font-semibold text-slate-700">{project.studentsRequired} students</p></div></div>
                <div className="flex items-start gap-2"><CalendarDays size={15} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Deadline</p><p className="mt-0.5 text-xs font-semibold text-slate-700">{project.deadline || 'Not set'}</p></div></div>
                <div className="flex items-start gap-2"><DollarSign size={15} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Budget</p><p className="mt-0.5 text-xs font-semibold text-slate-700">{project.budget || 'Not set'}</p></div></div>
              </div>
              <Badge>Open</Badge>
            </div>
          </Card>
          <p className="px-2 text-xs leading-5 text-slate-500">A clear brief helps students understand the opportunity and apply with confidence.</p>
        </div>
      </div>
    </div>
  )
}
