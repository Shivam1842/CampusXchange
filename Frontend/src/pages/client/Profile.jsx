import { useEffect, useState } from 'react'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import { api, uploadToCloudinary } from '../../api.js'

export default function ClientProfile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('/profiles/me')
      .then((result) => setProfile(result.data.profile))
      .catch((reason) => setError(reason.message))
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      const result = await api('/profiles/me', {
        method: 'PUT',
        body: Object.fromEntries([
          'businessName',
          'contactName',
          'contactEmail',
          'contactPhone',
          'industry',
          'companySize',
          'website',
          'description',
        ].map((field) => [field, form.get(field).toString().trim()])),
      })
      setProfile(result.data.profile)
      const avatarFile = form.get('avatarFile')
      if (avatarFile?.size) {
        const uploaded = await uploadToCloudinary('/profiles/me/avatar-upload', avatarFile)
        await api('/profiles/me/avatar', { method: 'POST', body: { avatar: uploaded.url, publicId: uploaded.publicId } })
        setProfile((current) => ({ ...current, avatar: uploaded.url }))
      }
    } catch (reason) {
      setError(reason.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Client workspace" title="Business profile" description="Keep your organization and contact details current for students reviewing your projects." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {!profile && !error ? <Card className="p-8 text-sm text-slate-500">Loading business profile…</Card> : profile && (
        <Card className="p-5 sm:p-7">
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Business name<input name="businessName" defaultValue={profile.businessName || ''} required className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm">Industry<input name="industry" defaultValue={profile.industry || ''} className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm">Contact person<input name="contactName" defaultValue={profile.contactName || ''} className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm">Company size<select name="companySize" defaultValue={profile.companySize || ''} className="mt-1 w-full rounded-lg border bg-white p-2.5"><option value="">Select size</option>{['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => <option key={size}>{size}</option>)}</select></label>
            <label className="text-sm">Contact email<input name="contactEmail" type="email" defaultValue={profile.contactEmail || ''} className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm">Contact phone<input name="contactPhone" defaultValue={profile.contactPhone || ''} className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm">Website<input name="website" type="url" defaultValue={profile.website || ''} placeholder="https://" className="mt-1 w-full rounded-lg border p-2.5 sm:col-span-2"/></label>
            <label className="text-sm sm:col-span-2">Business description<textarea name="description" defaultValue={profile.description || ''} maxLength={1000} rows={5} className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <label className="text-sm sm:col-span-2">Profile photo<input name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full rounded-lg border p-2.5"/></label>
            <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save business profile'}</Button></div>
          </form>
        </Card>
      )}
    </div>
  )
}
