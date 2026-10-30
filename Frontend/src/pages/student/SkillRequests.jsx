import { useEffect, useState } from 'react'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import PageHeading from '../../components/PageHeading.jsx'
import { api } from '../../api.js'

export default function SkillRequests() {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [error, setError] = useState('')

  async function loadRequests() {
    try {
      const [received, sent] = await Promise.all([
        api('/skill-requests?box=received'),
        api('/skill-requests?box=sent'),
      ])
      setIncoming(received.data.requests || [])
      setOutgoing(sent.data.requests || [])
    } catch (reason) {
      setError(reason.message)
    }
  }

  useEffect(() => { void Promise.resolve().then(loadRequests) }, [])

  async function respond(request, action) {
    setError('')
    try {
      await api(`/skill-requests/${request.id}/${action}`, { method: 'PATCH' })
      await loadRequests()
    } catch (reason) {
      setError(reason.message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Learning partners" title="Skill requests" description="Review incoming requests and keep track of the requests you have sent." />
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <RequestList title="Received requests" items={incoming} received onRespond={respond} />
      <RequestList title="Sent requests" items={outgoing} onRespond={respond} />
    </div>
  )
}

function RequestList({ title, items, received = false, onRespond }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="space-y-3">
        {items.map((request) => {
          const person = received ? request.sender : request.recipient
          return (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{person?.name || 'Student'}</p>
                <p className="text-sm capitalize text-slate-500">{request.status}</p>
              </div>
              {received && request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onRespond(request, 'accept')}>Accept</Button>
                  <Button size="sm" variant="danger" onClick={() => onRespond(request, 'reject')}>Reject</Button>
                </div>
              )}
            </div>
          )
        })}
        {!items.length && <p className="text-sm text-slate-500">No requests yet.</p>}
      </div>
    </Card>
  )
}
