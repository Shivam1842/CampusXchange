import { useEffect, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Badge from '../../components/Badge.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import SkillTag from '../../components/SkillTag.jsx'
import { api, uploadToCloudinary } from '../../api.js'
import Button from '../../components/Button.jsx'
import ReportButton from '../../components/ReportButton.jsx'

function Section({ title, children }) { return <Card className="p-5 sm:p-6"><h2 className="mb-5 text-base font-bold text-slate-900">{title}</h2>{children}</Card> }
export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reviews, setReviews] = useState([])
  useEffect(() => {
    api('/profiles/me').then((result) => {
      setProfile(result.data.profile)
      if (result.data.profile?.user) {
        api(`/users/${result.data.profile.user}/reviews`).then((reviewResult) => setReviews(reviewResult.data.reviews || [])).catch((reason) => setError(reason.message))
      }
    }).catch((reason) => setError(reason.message))
  }, [])
  async function saveProfile(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true); setError('')
    try {
      const rows = (name) => form.get(name).toString().split('\n').map((row) => row.split('|').map((part) => part.trim())).filter((parts) => parts[0])
      const skills = rows('skills').map(([name, level, proficiency]) => ({ name, level: level || 'beginner', proficiency: Number(proficiency) || 0 }))
      const certifications = rows('certifications').map(([name, issuer, year]) => ({ name, issuer, ...(year ? { year: Number(year) } : {}) }))
      const portfolio = rows('portfolio').map(([title, url, description]) => ({ title, url, description }))
      const github = form.get('github').toString().trim()
      const linkedin = form.get('linkedin').toString().trim()
      const result = await api('/profiles/me', { method: 'PUT', body: {
        title: form.get('title'), university: form.get('university'), course: form.get('course'),
        year: form.get('year'), experience: form.get('experience'), location: form.get('location'),
        bio: form.get('bio'), availability: form.get('availability'), skills, certifications, portfolio,
        wantedSkills: form.get('wantedSkills').toString().split(',').map((skill) => skill.trim()).filter(Boolean),
        socialLinks: [
          ...(github ? [{ label: 'GitHub', url: github }] : []),
          ...(linkedin ? [{ label: 'LinkedIn', url: linkedin }] : []),
        ],
      } })
      setProfile(result.data.profile)
      const avatarFile = form.get('avatarFile')
      if (avatarFile?.size) { const uploaded = await uploadToCloudinary('/profiles/me/avatar-upload', avatarFile); await api('/profiles/me/avatar', { method: 'POST', body: { avatar: uploaded.url, publicId: uploaded.publicId } }); setProfile((current) => ({ ...current, avatar: uploaded.url })) }
    } catch (reason) { setError(reason.message) } finally { setSaving(false) }
  }
  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><PageHeading eyebrow="Student profile" title="My profile" description="Your profile is built from your saved skills, education, and work." />
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!profile && !error ? <Card className="p-8 text-sm text-slate-500">Loading profile…</Card> : profile && <>
    <Card className="mb-5 p-5">
      <h2 className="mb-4 font-bold">Edit profile</h2>
      <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Title<input name="title" defaultValue={profile.title} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">University<input name="university" defaultValue={profile.university} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Course<input name="course" defaultValue={profile.course} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Year<input name="year" defaultValue={profile.year} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Location<input name="location" defaultValue={profile.location} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">Availability<input name="availability" defaultValue={profile.availability} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Experience<textarea name="experience" defaultValue={profile.experience || ''} maxLength={2000} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">About me<textarea name="bio" defaultValue={profile.bio} maxLength={1000} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Skills I offer — one per line: name | beginner/intermediate/advanced/expert | proficiency 0–100<textarea name="skills" defaultValue={(profile.skills || []).map((skill) => [skill.name, skill.level, skill.proficiency].join(' | ')).join('\n')} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Skills I want to learn<input name="wantedSkills" defaultValue={(profile.wantedSkills || []).join(', ')} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">GitHub URL<input name="github" type="url" defaultValue={profile.socialLinks?.find((link) => link.label === 'GitHub')?.url || ''} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm">LinkedIn URL<input name="linkedin" type="url" defaultValue={profile.socialLinks?.find((link) => link.label === 'LinkedIn')?.url || ''} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Certifications — one per line: name | issuer | year<textarea name="certifications" defaultValue={(profile.certifications || []).map((item) => [item.name, item.issuer, item.year].filter(Boolean).join(' | ')).join('\n')} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Portfolio projects — one per line: title | URL | description<textarea name="portfolio" defaultValue={(profile.portfolio || []).map((item) => [item.title, item.url, item.description].filter(Boolean).join(' | ')).join('\n')} className="mt-1 w-full rounded-lg border p-2"/></label>
        <label className="text-sm sm:col-span-2">Profile photo<input name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full rounded-lg border p-2"/></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button></div>
      </form>
    </Card>
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="overflow-hidden"><div className="h-20 bg-gradient-to-r from-teal-700 to-blue-900"/><div className="px-5 pb-5"><div className="-mt-10 flex items-end justify-between"><Avatar name={profile.name || ''} src={profile.avatar} size="xl" color="bg-amber-200 text-amber-950 ring-4 ring-white"/>{profile.isVerified && <Badge>Verified</Badge>}</div><h2 className="mt-4 text-xl font-bold">{profile.name || 'Student'}</h2><p className="mt-1 text-sm text-slate-600">{profile.title || 'Add a profile title'}</p><p className="mt-2 text-xs text-slate-500">{[profile.university, profile.year].filter(Boolean).join(' · ') || 'Education not added'}</p><div className="mt-4 text-sm text-slate-700"><span className="font-semibold">{profile.rating ?? '—'}</span><span className="ml-2 text-slate-400">({profile.reviews ?? 0} reviews)</span></div><div className="mt-5 border-t pt-5"><p className="text-xs font-semibold uppercase text-slate-400">About me</p><p className="mt-2 text-sm leading-6 text-slate-600">{profile.bio || 'No bio added yet.'}</p></div><dl className="mt-5 space-y-3 border-t pt-5 text-sm"><div><dt className="text-xs text-slate-400">Location</dt><dd className="mt-0.5">{profile.location || 'Not provided'}</dd></div><div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-0.5 break-all">{profile.email}</dd></div></dl><div className="mt-5 border-t pt-5"><p className="text-xs font-semibold uppercase text-slate-400">Availability</p><p className="mt-3 text-sm text-emerald-700">{profile.availability || 'Not set'}</p></div></div></Card>
      <div className="space-y-5"><Section title="Skills I offer"><div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{(profile.skills || []).map((skill) => <div key={skill.name}><div className="mb-2 flex justify-between"><span className="text-sm font-semibold">{skill.name}</span><span className="text-xs text-slate-500">{skill.level}</span></div><ProgressBar value={skill.proficiency ?? 0} showValue/></div>)}{!profile.skills?.length && <p className="text-sm text-slate-500">No skills added yet.</p>}</div></Section>
        <Section title="Skills I want to learn"><div className="flex flex-wrap gap-2">{(profile.wantedSkills || []).map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}{!profile.wantedSkills?.length && <p className="text-sm text-slate-500">No wanted skills added yet.</p>}</div></Section>
        <Section title="Certifications"><div className="grid gap-3 sm:grid-cols-2">{(profile.certifications || []).map((cert) => <div key={`${cert.name}-${cert.issuer}`} className="rounded-lg border p-4"><p className="text-sm font-semibold">{cert.name}</p><p className="mt-1 text-xs text-slate-500">{cert.issuer} {cert.year || ''}</p></div>)}{!profile.certifications?.length && <p className="text-sm text-slate-500">No certifications added yet.</p>}</div></Section>
        <Section title="Portfolio"><div className="grid gap-4 md:grid-cols-2">{(profile.portfolio || []).map((item) => <article key={item.title} className="rounded-lg border p-4"><p className="text-xs text-teal-700">{item.category}</p><h3 className="mt-1 font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{(item.skills || []).map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}</div>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-teal-700">View project</a>}</article>)}{!profile.portfolio?.length && <p className="text-sm text-slate-500">No portfolio projects added yet.</p>}</div></Section>
        <Section title="Reviews"><div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-lg border p-4"><div className="flex items-center justify-between"><p className="font-semibold">{review.reviewer?.name || 'CampusXchange user'}</p><Badge>{review.overallRating ?? review.rating} / 5</Badge></div><p className="mt-2 text-sm text-slate-600">{review.comment || 'No written feedback.'}</p><p className="mt-2 text-xs text-slate-500">Communication {review.communicationRating ?? '—'} · Technical {review.technicalSkillsRating ?? '—'} · Professionalism {review.professionalismRating ?? '—'}</p><div className="mt-2"><ReportButton targetType="review" targetId={review.id}/></div></article>)}{!reviews.length && <p className="text-sm text-slate-500">No reviews received yet.</p>}</div></Section></div>
    </div></>}
  </div>
}
