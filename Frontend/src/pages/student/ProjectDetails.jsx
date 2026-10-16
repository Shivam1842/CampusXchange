import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { activeProjects } from '../../mockData.js'

export default function ProjectDetails() {
  const { id } = useParams()
  const project = activeProjects.find((item) => item.id === id)
  const [submitted, setSubmitted] = useState(false)

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Project not found</h1>
        <p className="mt-2 text-sm text-slate-600">This project may have been removed or is no longer available.</p>
        <Link to="/student/projects" className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900">Back to projects</Link>
      </div>
    )
  }

  function submitApplication(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <Link to="/student/projects" className="mb-5 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900">← Browse projects</Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="bg-white/15 text-white ring-white/20">{project.category}</Badge>
                {project.clientVerified && <Badge tone="bg-emerald-300/15 text-emerald-100 ring-emerald-200/20">Verified client</Badge>}
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{project.title}</h1>
              <p className="mt-2 text-sm text-teal-50">{project.client} · {project.duration}</p>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
              <div><p className="text-xs text-slate-400">Budget</p><p className="mt-1 text-sm font-bold text-slate-900">{project.budget}</p></div>
              <div><p className="text-xs text-slate-400">Application deadline</p><p className="mt-1 text-sm font-bold text-slate-900">{project.deadline}</p></div>
              <div><p className="text-xs text-slate-400">Students needed</p><p className="mt-1 text-sm font-bold text-slate-900">{project.studentsRequired} collaborators</p></div>
            </div>
          </Card>
          <Card className="p-5 sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">About this project</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{project.description}</p>
            <h3 className="mt-7 text-sm font-bold text-slate-900">Required skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">{project.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div>
            <h3 className="mt-7 text-sm font-bold text-slate-900">What you’ll work on</h3>
            <ul className="mt-3 space-y-3">
              {project.requirements.map((requirement) => (
                <li key={requirement} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />{requirement}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="p-5 sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-slate-900">Apply to this project</h2>
          <p className="mt-1 text-sm text-slate-500">Tell the client how you can contribute.</p>
          {submitted ? (
            <div role="status" className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-900">Application submitted</p>
              <p className="mt-1 text-sm leading-5 text-emerald-800">Your application for {project.title} has been saved. You can track its status from your dashboard.</p>
              <Link to="/student/dashboard" className="mt-3 inline-block text-sm font-semibold text-emerald-900 underline">Go to dashboard</Link>
            </div>
          ) : (
            <form onSubmit={submitApplication} className="mt-5 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">Apply as</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-medium text-teal-900">
                    <input type="radio" name="applicantType" value="individual" defaultChecked className="accent-teal-700" /> Individual
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
                    <input type="radio" name="applicantType" value="team" className="accent-teal-700" /> As a team
                  </label>
                </div>
              </fieldset>
              <div>
                <label htmlFor="cover-message" className="mb-1.5 block text-sm font-medium text-slate-700">Cover message</label>
                <textarea id="cover-message" name="message" required minLength={20} maxLength={1200} rows={5} placeholder="Share why you’re a good fit and what you’d bring to the team..." className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm leading-5 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
                <p className="mt-1 text-xs text-slate-400">At least 20 characters.</p>
              </div>
              <div>
                <label htmlFor="portfolio-link" className="mb-1.5 block text-sm font-medium text-slate-700">Portfolio or relevant link <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="portfolio-link" name="link" type="url" placeholder="https://your-portfolio.com" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
              <Button type="submit" size="lg" className="w-full">Submit application</Button>
              <p className="text-center text-xs leading-5 text-slate-400">You can review your application status on the dashboard.</p>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
