import { useMemo, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { recommendedPartners } from '../../mockData.js'

export default function Partners() {
  const [query, setQuery] = useState('')
  const [requested, setRequested] = useState([])
  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return recommendedPartners
    return recommendedPartners.filter((partner) =>
      [partner.name, partner.title, partner.university, ...partner.skills, ...partner.wants]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [query])

  function toggleRequest(name) {
    setRequested((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading
        eyebrow="Grow together"
        title="Learning partners"
        description="Meet students with complementary skills and find your next collaborator."
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Search partners</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, skill, or university..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <div className="rounded-lg bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {filteredPartners.length} students match your skills
        </div>
      </div>
      {filteredPartners.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPartners.map((partner) => {
            const isRequested = requested.includes(partner.name)
            return (
              <Card key={partner.name} className="flex flex-col p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={partner.name} size="md" color={partner.color} />
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-900">{partner.name}</h2>
                      <p className="truncate text-xs text-slate-500">{partner.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{partner.university}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800">
                    {partner.match}% match
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-bold text-amber-500">★</span>{partner.rating} <span className="text-slate-400">· trusted student</span>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Offers</p>
                  <div className="flex flex-wrap gap-1.5">{partner.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Wants to learn</p>
                  <div className="flex flex-wrap gap-1.5">{partner.wants.map((skill) => <SkillTag key={skill} variant="navy">{skill}</SkillTag>)}</div>
                </div>
                <Button
                  variant={isRequested ? 'subtle' : 'primary'}
                  className="mt-5 w-full"
                  aria-pressed={isRequested}
                  onClick={() => toggleRequest(partner.name)}
                >
                  {isRequested ? 'Request sent' : 'Send request'}
                </Button>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="px-6 py-14 text-center">
          <h2 className="font-semibold text-slate-900">No students found</h2>
          <p className="mt-2 text-sm text-slate-500">Try searching for a different name, skill, or university.</p>
        </Card>
      )}
    </div>
  )
}
