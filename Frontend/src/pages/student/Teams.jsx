import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { api, getStoredUser } from '../../api.js'

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [discoverableTeams, setDiscoverableTeams] = useState([])
  const [invitations, setInvitations] = useState([])
  const [teamSearch, setTeamSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const user = getStoredUser()
  async function refresh() {
    try { const [teamResult, inviteResult, discoverResult] = await Promise.all([api('/teams/mine'), api('/teams/invitations/mine'), api('/teams?status=forming&limit=50')]); setTeams(teamResult.data.teams || []); setInvitations(inviteResult.data.invitations || []); setDiscoverableTeams(discoverResult.data.teams || []); setError('') }
    catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }
  useEffect(() => { void Promise.resolve().then(refresh) }, [])
  async function createTeam(event) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await api('/teams', { method: 'POST', body: { name: form.get('name').toString(), description: form.get('description').toString(), skills: form.get('skills').toString().split(',').map((item) => item.trim()).filter(Boolean) } }); event.currentTarget.reset(); await refresh() } catch (reason) { setError(reason.message) } }
  async function respond(invitation, action) { try { await api(`/teams/invitations/${invitation.id}/${action}`, { method: 'PATCH' }); await refresh() } catch (reason) { setError(reason.message) } }
  async function invite(teamId, event) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await api(`/teams/${teamId}/invitations`, { method: 'POST', body: { userId: form.get('userId') } }); event.currentTarget.reset() } catch (reason) { setError(reason.message) } }
  async function changeStatus(team, status) { try { await api(`/teams/${team.id}/status`, { method: 'PATCH', body: { status } }); await refresh() } catch (reason) { setError(reason.message) } }
  async function removeMember(teamId, userId) { try { await api(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }); await refresh() } catch (reason) { setError(reason.message) } }
  async function searchStudents(value) {
    setStudentSearch(value)
    if (!value.trim()) { setStudents([]); return }
    try {
      const result = await api(`/matching/partners?${new URLSearchParams({ search: value.trim(), limit: '20' })}`)
      setStudents(result.data.partners || [])
    } catch (reason) { setError(reason.message) }
  }
  async function joinTeam(team) {
    try { await api(`/teams/${team.id}/join`, { method: 'POST' }); await refresh() }
    catch (reason) { setError(reason.message) }
  }
  async function leaveTeam(team) {
    try { await api(`/teams/${team.id}/leave`, { method: 'POST' }); await refresh() }
    catch (reason) { setError(reason.message) }
  }
  const filteredDiscoverableTeams = discoverableTeams.filter((team) => !teams.some((mine) => mine.id === team.id) && (!teamSearch.trim() || `${team.name} ${team.description} ${(team.skills || []).join(' ')}`.toLowerCase().includes(teamSearch.trim().toLowerCase())))
  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><PageHeading eyebrow="Build together" title="Your teams" description="Bring different strengths together to make something great." action={<Link to="/student/applications" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Applications &amp; workspaces</Link>}/>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-slate-800">{error}</p>}
    {loading ? <Card className="p-8 text-sm text-slate-500">Loading teams…</Card> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div className="space-y-5"><Card className="p-5 sm:p-6"><h2 className="mb-4 text-base font-bold">Create a team</h2><form onSubmit={createTeam} className="space-y-4"><label className="block text-sm">Team name<input name="name" required minLength={3} maxLength={80} className="mt-1 w-full rounded-lg border p-2.5"/></label><label className="block text-sm">Description<textarea name="description" rows={3} maxLength={1000} className="mt-1 w-full rounded-lg border p-2.5"/></label><label className="block text-sm">Required skills<input name="skills" placeholder="React, UI/UX" className="mt-1 w-full rounded-lg border p-2.5"/></label><Button type="submit" className="w-full">Create team</Button></form></Card>
      <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Team invitations</h2><Badge>{invitations.length} pending</Badge></div>{invitations.length ? invitations.map((item) => <div key={item.id} className="mb-3 rounded-lg border p-4"><p className="font-semibold">{item.team?.name || 'Team invitation'}</p><p className="mt-1 text-xs text-slate-500">Invited by {item.inviter?.name || 'a teammate'}</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => respond(item, 'accept')}>Accept</Button><Button size="sm" variant="secondary" onClick={() => respond(item, 'reject')}>Decline</Button></div></div>) : <p className="text-sm text-slate-500">No pending invitations.</p>}</Card></div>
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-bold">Find a team</h2>
          <input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Search teams or skills" className="mt-3 w-full rounded-lg border p-2.5 text-sm"/>
          <div className="mt-3 space-y-2">{filteredDiscoverableTeams.map((team) => <div key={team.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{team.name}</p><p className="text-xs text-slate-500">{team.skills.join(', ')}</p></div><Button size="sm" onClick={() => joinTeam(team)}>Join</Button></div>)}{!filteredDiscoverableTeams.length && <p className="text-sm text-slate-500">No open teams match your search.</p>}</div>
        </Card>
        {teams.length ? teams.map((team) => { const owner = team.owner?.id === user?.id; const member = team.members.some((item) => item.user?.id === user?.id); return <Card key={team.id} className="overflow-hidden"><div className="border-b p-5 sm:p-6"><p className="text-xs font-semibold uppercase text-teal-700">Team</p><div className="mt-1 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{team.name}</h2><Badge>{team.status}</Badge></div><p className="mt-1 text-sm text-slate-500">{team.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{team.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div>{owner && <div className="mt-4 flex flex-wrap gap-2">{team.status === 'forming' && <Button size="sm" onClick={() => changeStatus(team, 'active')}>Activate team</Button>}{team.status === 'active' && <Button size="sm" onClick={() => changeStatus(team, 'completed')}>Complete team</Button>}{['forming', 'active'].includes(team.status) && <Button size="sm" variant="danger" onClick={() => changeStatus(team, 'disbanded')}>Disband</Button>}</div>}{member && !owner && ['forming', 'active'].includes(team.status) && <Button size="sm" variant="danger" className="mt-4" onClick={() => leaveTeam(team)}>Leave team</Button>}</div><div className="divide-y">{team.members.map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><Avatar name={item.user?.name || 'Member'} size="sm"/><div className="flex-1"><p className="text-sm font-semibold">{item.user?.name || 'Member'}</p><p className="text-xs text-slate-500">{item.role}</p></div>{owner && item.role !== 'owner' && <Button size="sm" variant="danger" onClick={() => removeMember(team.id, item.user.id)}>Remove</Button>}</div>)}</div>{owner && <form onSubmit={(event) => invite(team.id, event)} className="space-y-2 border-t p-4"><label className="block text-xs font-medium">Search students to invite<input value={studentSearch} onChange={(event) => searchStudents(event.target.value)} placeholder="Search by name or skill" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label><select name="userId" required defaultValue="" className="w-full rounded-lg border bg-white p-2 text-sm"><option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.title || student.headline || 'Student'}</option>)}</select><Button type="submit" size="sm">Send invitation</Button></form>}</Card>}) : <Card className="p-8 text-center text-sm text-slate-500">You are not a member of any team yet. Create a team or accept an invitation.</Card>}
      </div>
    </div>}
  </div>
}
