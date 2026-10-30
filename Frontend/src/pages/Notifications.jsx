import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import PageHeading from '../components/PageHeading.jsx'
import { api } from '../api.js'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    try {
      const result = await api('/notifications?page=1&limit=50')
      setNotifications(result.data.notifications || [])
      setUnread(result.data.unread || 0)
    } catch (reason) {
      setError(reason.message)
    }
  }

  useEffect(() => { void Promise.resolve().then(load) }, [])

  async function markRead(notification) {
    try {
      await api(`/notifications/${notification.id}/read`, { method: 'PATCH' })
      await load()
    } catch (reason) {
      setError(reason.message)
    }
  }

  async function markAllRead() {
    try {
      await api('/notifications/read-all', { method: 'PATCH' })
      await load()
    } catch (reason) {
      setError(reason.message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeading eyebrow="Updates" title="Notifications" description={`${unread} unread notification${unread === 1 ? '' : 's'}.`} action={unread > 0 && <Button variant="secondary" onClick={markAllRead}>Mark all read</Button>} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="space-y-3">{notifications.map((item) => <Card key={item.id} className={`flex items-center justify-between gap-4 p-4 ${item.readAt ? '' : 'border-teal-300 bg-teal-50/50'}`}><div><p className="text-sm font-medium">{item.message}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div>{!item.readAt && <Button size="sm" variant="secondary" onClick={() => markRead(item)}>Mark read</Button>}</Card>)}
      {!notifications.length && <Card className="p-8 text-center text-sm text-slate-500">You are all caught up.</Card>}</div>
    </div>
  )
}
