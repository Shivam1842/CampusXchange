import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Send } from 'lucide-react'
import Avatar from '../components/Avatar.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import SkillTag from '../components/SkillTag.jsx'
import { api, getStoredUser } from '../api.js'
import ReportButton from '../components/ReportButton.jsx'

const label = (value) => (value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
export default function Workspace() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const user = getStoredUser()
  const load = useCallback(async () => {
    try { const [projectResult, taskResult, messageResult] = await Promise.all([api(`/projects/${projectId}/workspace`), api(`/projects/${projectId}/tasks`), api(`/projects/${projectId}/messages`)]); setProject(projectResult.data.project); setTasks(taskResult.data.tasks || []); setMessages(messageResult.data.messages || []); setError('') }
    catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const completed = tasks.filter((task) => task.status === 'completed').length
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  async function toggleTask(task) { const status = task.status === 'completed' ? 'not_started' : 'completed'; try { const result = await api(`/projects/${projectId}/tasks/${task.id}`, { method: 'PATCH', body: { status } }); setTasks((items) => items.map((item) => item.id === task.id ? result.data.task : item)); setProject((item) => ({ ...item, progress: result.data.progress })) } catch (reason) { setError(reason.message) } }
  async function addTask(event) { event.preventDefault(); try { const result = await api(`/projects/${projectId}/tasks`, { method: 'POST', body: { title: taskTitle } }); setTasks((items) => [...items, result.data.task]); setTaskTitle('') } catch (reason) { setError(reason.message) } }
  async function sendMessage(event) { event.preventDefault(); const text = message.trim(); if (!text) return; try { const result = await api(`/projects/${projectId}/messages`, { method: 'POST', body: { text } }); setMessages((items) => [...items, result.data.message]); setMessage('') } catch (reason) { setError(reason.message) } }
  async function changeProjectStatus(status) {
    try {
      const result = await api(`/projects/${projectId}/status`, { method: 'PATCH', body: { status } })
      setProject(result.data.project)
    } catch (reason) { setError(reason.message) }
  }
  if (loading) return <div className="p-12 text-center text-sm text-slate-500">Loading workspace…</div>
  if (!project) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Workspace unavailable</h1><p role="alert" className="mt-2 text-sm text-rose-700">{error}</p><Link to="/student/dashboard" className="mt-5 inline-block text-sm font-semibold text-teal-700">Back to dashboard</Link></div>
  return <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><Link to={user?.role === 'client' ? '/client/applications' : '/student/dashboard'} className="text-xs font-semibold text-teal-700">← Workspace</Link><div className="mt-2 flex items-center gap-3"><h1 className="text-2xl font-bold">{project.title}</h1><Badge>{label(project.status)}</Badge></div><p className="mt-1 text-sm text-slate-500">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Flexible'}</p>{user?.role === 'client' && <div className="mt-3 flex flex-wrap gap-2">{project.status === 'open' && <Button size="sm" onClick={() => changeProjectStatus('in_progress')}>Start project</Button>}{project.status === 'in_progress' && <Button size="sm" onClick={() => changeProjectStatus('under_review')}>Submit for review</Button>}{project.status === 'under_review' && <Button size="sm" onClick={() => changeProjectStatus('completed')}>Mark completed</Button>}</div>}</div><div className="flex flex-wrap gap-1.5">{(project.skills || []).map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}</div></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <Card className="mt-6 p-5"><div className="mb-4 flex justify-between"><div><h2 className="font-bold">Project progress</h2><p className="text-xs text-slate-500">Calculated from completed tasks</p></div><strong className="text-teal-800">{project.progress ?? progress}%</strong></div><ProgressBar value={project.progress ?? progress}/></Card>
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Project tasks</h2><p className="mt-1 text-xs text-slate-500">{completed} of {tasks.length} completed</p></div><div className="divide-y">{tasks.map((task) => <div key={task.id} className="flex items-start gap-3 p-5"><button type="button" onClick={() => toggleTask(task)} aria-pressed={task.status === 'completed'} className={`mt-0.5 grid size-5 place-items-center rounded border ${task.status === 'completed' ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300'}`}><Check size={13}/></button><div className="flex-1"><p className="text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-slate-500">{label(task.status)}{task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}</p></div><Badge>{label(task.status)}</Badge></div>)}{!tasks.length && <p className="p-5 text-sm text-slate-500">No tasks yet.</p>}</div><form onSubmit={addTask} className="flex gap-2 border-t p-4"><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required placeholder="Add a task" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"/><Button type="submit">Add task</Button></form></Card>
      <Card className="flex min-h-[560px] flex-col overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Project messages</h2><p className="mt-1 text-xs text-slate-500">Messages appear after the server saves them.</p></div><div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/70 p-4" aria-live="polite">{messages.map((item) => <div key={item.id} className="flex gap-2.5"><Avatar name={item.sender?.name || 'Member'} size="sm" src={item.sender?.avatar}/><div><p className="mb-1 text-[11px] font-semibold text-slate-700">{item.sender?.name || 'Member'} · {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</p><div className="rounded-xl border bg-white px-3.5 py-3 text-sm">{item.text}</div><ReportButton targetType="message" targetId={item.id}/></div></div>)}{!messages.length && <p className="m-auto text-sm text-slate-500">No messages yet.</p>}</div><form onSubmit={sendMessage} className="flex gap-2 border-t p-3"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-sm"/><Button type="submit" aria-label="Send message" disabled={!message.trim()}><Send size={16}/></Button></form></Card></div>
  </div>
}
