import { useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { activeTeam, teamInvitations } from '../../mockData.js'

export default function Teams() {
  const [invitations, setInvitations] = useState(teamInvitations)
  const [team, setTeam] = useState(activeTeam)
  const [createdTeam, setCreatedTeam] = useState(null)

  function createTeam(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const newTeam = {
      name: formData.get('name').trim(),
      description: formData.get('description').trim(),
      skills: formData.get('skills').split(',').map((skill) => skill.trim()).filter(Boolean),
    }
    setCreatedTeam(newTeam)
    event.currentTarget.reset()
  }

  function respondToInvitation(invitation, accepted) {
    setInvitations((current) => current.filter((item) => item.team !== invitation.team))
    if (accepted) {
      setTeam((current) => [
        ...current,
        { name: invitation.from, role: 'Invited teammate', skill: invitation.project, color: invitation.color },
      ])
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Build together" title="Your teams" description="Bring different strengths together to make something great." />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">Create a team</h2>
              <p className="mt-1 text-sm text-slate-500">Start a team and let the right collaborators find you.</p>
            </div>
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-slate-700">Team name</label>
                <input id="team-name" name="name" required maxLength={60} placeholder="e.g. Project Atlas" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label htmlFor="team-description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                <textarea id="team-description" name="description" required rows={3} maxLength={300} placeholder="What are you hoping to build together?" className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label htmlFor="team-skills" className="mb-1.5 block text-sm font-medium text-slate-700">Required skills</label>
                <input id="team-skills" name="skills" required placeholder="React, UI/UX, Product management" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
                <p className="mt-1.5 text-xs text-slate-400">Separate skills with commas.</p>
              </div>
              <Button type="submit" className="w-full">Create team</Button>
            </form>
            {createdTeam && (
              <div role="status" className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">{createdTeam.name} is ready</p>
                <p className="mt-1 text-xs text-teal-800">{createdTeam.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{createdTeam.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Team invitations</h2>
              <Badge tone="bg-teal-50 text-teal-800 ring-teal-600/15">{invitations.length} pending</Badge>
            </div>
            {invitations.length ? (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.team} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={invitation.from} size="sm" color={invitation.color} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{invitation.team}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {invitation.from} invited you to collaborate on <span className="font-medium text-slate-700">{invitation.project}</span>
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => respondToInvitation(invitation, true)}>Accept</Button>
                          <Button size="sm" variant="secondary" onClick={() => respondToInvitation(invitation, false)}>Decline</Button>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">{invitation.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">You’re all caught up. New team invitations will appear here.</p>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Active team</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Campus Connect</h2>
                <p className="mt-1 text-sm text-slate-500">Building a better campus community, together.</p>
              </div>
              <Badge>In Progress</Badge>
            </div>
          </div>
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-6">
              <div><p className="text-xs text-slate-400">Team members</p><p className="mt-1 text-lg font-bold text-slate-900">{team.length}</p></div>
              <div><p className="text-xs text-slate-400">Project deadline</p><p className="mt-1 text-sm font-semibold text-slate-800">Nov 18, 2026</p></div>
              <div className="ml-auto flex -space-x-2">
                {team.slice(0, 4).map((member) => <Avatar key={member.name} name={member.name} size="sm" color={`${member.color} ring-2 ring-white`} />)}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 sm:px-6">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member, index) => (
                  <tr key={`${member.name}-${index}`}>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" color={member.color} />
                        <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{member.role}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{member.skill}</td>
                    <td className="px-4 py-4">
                      <button type="button" disabled={member.name === 'Alex Morgan'} className="text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:cursor-default disabled:text-slate-400">
                        {member.name === 'Alex Morgan' ? 'You' : 'Message'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
