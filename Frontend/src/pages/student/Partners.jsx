import { useEffect, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import ReportButton from '../../components/ReportButton.jsx'
import { api } from '../../api.js'

export default function Partners() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ skill: '', experience: '', interest: '', availability: '', requirements: '' })
  const [partners, setPartners] = useState([])
  const [requested, setRequested] = useState(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) { setLoading(true); setError('') }
      return api(`/matching/partners?${new URLSearchParams({ page: '1', limit: '50', ...(query.trim() ? { search: query.trim() } : {}), ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())) })}`)
    }).then((result) => { if (active) setPartners(result.data.partners || []) })
      .catch((reason) => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, filters])
  async function sendRequest(partner) {
    try { await api('/skill-requests', { method: 'POST', body: { recipientId: partner.id } }); setRequested((current) => new Set([...current, partner.id])) }
    catch (reason) { setError(reason.message) }
  }
  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><PageHeading eyebrow="Grow together" title="Learning partners" description="Meet students with complementary skills and find your next collaborator." />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Search partners</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or skill..." className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"/></label><div className="rounded-lg bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{partners.length} students</div></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['skill', 'Skill'], ['experience', 'Experience'], ['interest', 'Interest'], ['availability', 'Availability'], ['requirements', 'Project requirements (comma separated)']].map(([key, label]) => <label key={key} className="text-xs font-medium text-slate-500">{label}<input value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm"/></label>)}</div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading ? <Card className="p-8 text-sm text-slate-500">Loading partners…</Card> : partners.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{partners.map((partner) => { const offered = partner.skills || []; const wanted = partner.wantedSkills || []; const isRequested = requested.has(partner.id); return <Card key={partner.id} className="flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar name={partner.name} src={partner.avatar} size="md"/><div className="min-w-0"><h2 className="truncate font-bold">{partner.name}</h2><p className="truncate text-xs text-slate-500">{partner.title || partner.headline}</p><p className="text-xs text-slate-400">{[partner.university, partner.year].filter(Boolean).join(' · ')}</p></div></div><span className="text-xs font-bold text-teal-800">{partner.match == null ? '—' : `${partner.match}%`}</span></div>
      <p className="mt-4 text-xs text-slate-600">Rating: {partner.rating ?? '—'} · {partner.reviews ?? 0} reviews</p><div className="mt-4"><p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Offers</p><div className="flex flex-wrap gap-1.5">{offered.map((skill) => <SkillTag key={skill.name || skill} variant="teal">{skill.name || skill}</SkillTag>)}</div></div><div className="mt-4"><p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Wants to learn</p><div className="flex flex-wrap gap-1.5">{wanted.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}</div></div><Button variant={isRequested ? 'subtle' : 'primary'} className="mt-5 w-full" disabled={isRequested} onClick={() => sendRequest(partner)}>{isRequested ? 'Request sent' : 'Send request'}</Button><div className="mt-2"><ReportButton targetType="user" targetId={partner.id}/></div></Card>})}</div> : <Card className="px-6 py-14 text-center"><h2 className="font-semibold">No students found</h2><p className="mt-2 text-sm text-slate-500">Try another search.</p></Card>}
  </div>
}
