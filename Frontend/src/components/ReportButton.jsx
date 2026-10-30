import { useState } from 'react'
import Button from './Button.jsx'
import { api } from '../api.js'

export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await api('/reports', { method: 'POST', body: { targetType, targetId, reason } })
      setNotice('Report submitted for admin review.')
      setReason('')
      setOpen(false)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div>
      {notice ? <p role="status" className="text-xs text-emerald-700">{notice}</p> : <Button type="button" size="sm" variant="subtle" onClick={() => setOpen((value) => !value)}>Report</Button>}
      {open && <form onSubmit={submit} className="mt-2 space-y-2"><label className="sr-only" htmlFor={`report-${targetType}-${targetId}`}>Reason for report</label><textarea id={`report-${targetType}-${targetId}`} value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={2000} rows={3} className="w-full rounded-lg border p-2 text-sm" placeholder="Explain why this should be reviewed"/>{error && <p role="alert" className="text-xs text-rose-700">{error}</p>}<div className="flex gap-2"><Button type="submit" size="sm">Submit report</Button><Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div></form>}
    </div>
  )
}
