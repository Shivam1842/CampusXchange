import { useState } from 'react'
import Button from './Button.jsx'
import { api } from '../api.js'

const criteria = [
  ['overallRating', 'Overall'],
  ['communicationRating', 'Communication'],
  ['technicalSkillsRating', 'Technical skills'],
  ['professionalismRating', 'Professionalism'],
]

export default function ReviewForm({ projectId, revieweeId, revieweeName, onSubmitted }) {
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    try {
      await api('/reviews', {
        method: 'POST',
        body: {
          projectId,
          revieweeId,
          ...Object.fromEntries(criteria.map(([field]) => [field, Number(form.get(field))])),
          comment: form.get('comment').toString().trim(),
        },
      })
      setSubmitted(true)
      onSubmitted?.()
    } catch (reason) {
      setError(reason.message)
    }
  }

  if (submitted) return <p role="status" className="text-sm font-medium text-emerald-700">Review submitted for {revieweeName}.</p>

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-semibold">Review {revieweeName}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map(([field, label]) => <label key={field} className="text-xs font-medium text-slate-600">{label}<select name={field} required defaultValue="5" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label>)}
      </div>
      <label className="block text-xs font-medium text-slate-600">Feedback<textarea name="comment" maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <Button type="submit" size="sm">Submit review</Button>
    </form>
  )
}
