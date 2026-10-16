import { useMemo, useState } from 'react'
import { Check, GitCompareArrows, Star, X } from 'lucide-react'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { activeProjects, clientApplicants } from '../../mockData.js'

export default function Applications() {
  const [projectId, setProjectId] = useState(activeProjects[0].id)
  const [statuses, setStatuses] = useState({})
  const [compared, setCompared] = useState(clientApplicants.slice(0, 2).map((applicant) => applicant.id))
  const selectedProject = activeProjects.find((project) => project.id === projectId) ?? activeProjects[0]
  const comparedApplicants = useMemo(
    () => compared.map((id) => clientApplicants.find((applicant) => applicant.id === id)).filter(Boolean).slice(0, 3),
    [compared],
  )

  function setStatus(id, status) {
    setStatuses((current) => ({ ...current, [id]: status }))
  }

  function toggleCompared(id) {
    setCompared((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current)
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Client workspace" title="Applications" description="Review applicants, compare their strengths, and choose collaborators for your project." />
      <Card className="mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <label htmlFor="applications-project" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Selected project</label>
          <select id="applications-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            {activeProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <div><p className="text-xs text-slate-400">Applications</p><p className="mt-1 font-bold text-slate-900">{clientApplicants.length} received</p></div>
          <div><p className="text-xs text-slate-400">Application deadline</p><p className="mt-1 font-bold text-slate-900">{selectedProject.deadline}</p></div>
          <div><p className="text-xs text-slate-400">Spots to fill</p><p className="mt-1 font-bold text-slate-900">{selectedProject.studentsRequired}</p></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Applicants</h2>
            <p className="mt-1 text-xs text-slate-500">Select up to three applicants to compare below.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><GitCompareArrows size={14} /> {compared.length}/3 selected to compare</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 sm:px-6">Applicant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Skills</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Compare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientApplicants.map((applicant) => {
                const status = statuses[applicant.id] ?? 'Under Review'
                return (
                  <tr key={applicant.id} className="align-middle">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={applicant.name} size="sm" color={applicant.color} />
                        <div><p className="whitespace-nowrap text-sm font-semibold text-slate-900">{applicant.name}</p><p className="mt-0.5 text-xs text-slate-500">{applicant.match}% project match</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><Badge tone={applicant.type === 'Team' ? 'bg-blue-50 text-blue-800 ring-blue-600/15' : 'bg-slate-100 text-slate-700 ring-slate-500/15'}>{applicant.type}</Badge></td>
                    <td className="px-4 py-4"><div className="flex max-w-64 flex-wrap gap-1.5">{applicant.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}</div></td>
                    <td className="px-4 py-4"><span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700"><Star size={14} className="fill-amber-400 text-amber-400" />{applicant.rating}</span><p className="mt-1 whitespace-nowrap text-[11px] text-slate-400">{applicant.completedProjects} projects</p></td>
                    <td className="px-4 py-4"><Badge>{status}</Badge></td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant={status === 'Shortlisted' ? 'subtle' : 'secondary'} disabled={status === 'Selected'} onClick={() => setStatus(applicant.id, status === 'Shortlisted' ? 'Under Review' : 'Shortlisted')}>Shortlist</Button>
                        <Button size="sm" variant="navy" disabled={status === 'Selected'} onClick={() => setStatus(applicant.id, 'Selected')}>{status === 'Selected' ? 'Selected' : 'Select'}</Button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                        <input type="checkbox" checked={compared.includes(applicant.id)} onChange={() => toggleCompared(applicant.id)} disabled={!compared.includes(applicant.id) && compared.length >= 3} className="size-4 rounded border-slate-300 accent-teal-700" />
                        Compare
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="mt-7">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Make your choice</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Compare applicants</h2>
        </div>
        {comparedApplicants.length > 0 ? (
          <div className={`grid gap-4 ${comparedApplicants.length === 2 ? 'md:grid-cols-2' : comparedApplicants.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {comparedApplicants.map((applicant) => (
              <Card key={applicant.id} className="overflow-hidden">
                <div className="flex items-start justify-between border-b border-slate-100 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={applicant.name} size="md" color={applicant.color} />
                    <div><h3 className="font-bold text-slate-900">{applicant.name}</h3><p className="mt-1 text-xs text-slate-500">{applicant.type} applicant</p></div>
                  </div>
                  <button type="button" onClick={() => toggleCompared(applicant.id)} aria-label={`Remove ${applicant.name} from comparison`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
                </div>
                <dl className="divide-y divide-slate-100 px-5">
                  <div className="flex justify-between py-3 text-sm"><dt className="text-slate-500">Project match</dt><dd className="font-bold text-teal-800">{applicant.match}%</dd></div>
                  <div className="flex justify-between py-3 text-sm"><dt className="text-slate-500">Rating</dt><dd className="inline-flex items-center gap-1 font-semibold text-slate-800"><Star size={13} className="fill-amber-400 text-amber-400" />{applicant.rating}</dd></div>
                  <div className="flex justify-between py-3 text-sm"><dt className="text-slate-500">Completed projects</dt><dd className="font-semibold text-slate-800">{applicant.completedProjects}</dd></div>
                </dl>
                <div className="px-5 pb-5">
                  <p className="text-xs leading-5 text-slate-600">{applicant.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{applicant.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div>
                  <Button className="mt-4 w-full" variant="navy" disabled={statuses[applicant.id] === 'Selected'} onClick={() => setStatus(applicant.id, 'Selected')}>
                    {statuses[applicant.id] === 'Selected' ? <><Check size={15} /> Selected</> : 'Select applicant'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-slate-500">Choose applicants in the table above to compare their experience side by side.</Card>
        )}
      </section>
    </div>
  )
}
