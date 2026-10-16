import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { studentProfile } from '../../mockData.js'

function SectionCard({ title, action, children, className = '' }) {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action && <button type="button" className="text-xs font-semibold text-teal-700 hover:text-teal-900">{action}</button>}
      </div>
      {children}
    </Card>
  )
}

export default function Profile() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Student profile" title="My profile" description="Share your experience, skills, and the work you’re proud of." />
      <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-teal-700 to-blue-900" />
          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between">
              <Avatar name={studentProfile.name} size="xl" color="bg-amber-200 text-amber-950 ring-4 ring-white" />
              <Badge>Verified</Badge>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{studentProfile.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{studentProfile.title}</p>
            <p className="mt-2 text-xs text-slate-500">{studentProfile.university} · {studentProfile.year}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <span className="font-bold text-amber-500">★</span>
              <span className="font-semibold">{studentProfile.rating}</span>
              <span className="text-slate-400">({studentProfile.reviews} reviews)</span>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">About me</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{studentProfile.bio}</p>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="text-xs text-slate-400">Location</dt><dd className="mt-0.5 font-medium text-slate-700">{studentProfile.location}</dd></div>
                <div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-0.5 break-all font-medium text-slate-700">{studentProfile.email}</dd></div>
              </dl>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Availability</p>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />{studentProfile.availability}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <SectionCard title="Skills I offer" action="Edit skills">
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {studentProfile.skills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{skill.name}</span>
                    <span className="text-xs text-slate-500">{skill.proficiency}</span>
                  </div>
                  <ProgressBar value={skill.level} showValue />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Skills I want to learn" action="Edit interests">
            <div className="flex flex-wrap gap-2">
              {studentProfile.wantedSkills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}
            </div>
          </SectionCard>
          <SectionCard title="Certifications" action="Add certification">
            <div className="grid gap-3 sm:grid-cols-2">
              {studentProfile.certifications.map((certification) => (
                <div key={certification.name} className="flex gap-3 rounded-lg border border-slate-100 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-800">✓</span>
                  <div>
                    <p className="text-sm font-semibold leading-5 text-slate-800">{certification.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{certification.issuer}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Portfolio projects" action="Add project">
            <div className="grid gap-4 md:grid-cols-2">
              {studentProfile.portfolio.map((project) => (
                <article key={project.title} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid h-28 place-items-center bg-gradient-to-br from-teal-50 to-blue-100 text-3xl font-bold text-teal-800">
                    {project.title.split(' ').map((word) => word[0]).join('')}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-teal-700">{project.category}</p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{project.title}</h3>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
