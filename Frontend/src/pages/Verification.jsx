import { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import PageHeading from '../components/PageHeading.jsx'
import Button from '../components/Button.jsx'
import { api, uploadToCloudinary } from '../api.js'

export default function Verification() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api('/verification-documents').then((result) => setStatus(result.data.documents?.map((item) => item.status).join(', ') || 'No documents submitted')).catch((reason) => setError(reason.message)) }, [])
  async function submit(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get('document'); setError(''); try { const uploaded = await uploadToCloudinary('/verification-documents/upload', file); const result = await api('/verification-documents', { method: 'POST', body: { documentType: form.get('documentType'), documentUrl: uploaded.url, publicId: uploaded.publicId, format: uploaded.format, resourceType: uploaded.resourceType } }); setStatus(result.data.document.status); event.currentTarget.reset() } catch (reason) { setError(reason.message) } }
  return <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6"><PageHeading eyebrow="Account verification" title="Verification documents" description="Upload a student ID, enrollment letter, or business registration record for private admin review."/>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<Card className="p-5"><p className="mb-4 text-sm">Submission status: <strong>{status || 'Loading…'}</strong></p><form onSubmit={submit} className="space-y-4"><label className="block text-sm">Document type<select name="documentType" className="mt-1 w-full rounded-lg border bg-white p-2"><option value="student_id">Student ID</option><option value="enrollment_letter">Enrollment letter</option><option value="business_registration">Business registration</option><option value="other">Other</option></select></label><label className="block text-sm">Document (PDF, JPG, PNG)<input name="document" type="file" required accept="application/pdf,image/jpeg,image/png" className="mt-1 w-full rounded-lg border p-2"/></label><Button type="submit">Submit for review</Button></form></Card></div>
}
