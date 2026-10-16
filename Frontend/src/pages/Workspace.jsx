import { useState } from 'react'
import { Check, ChevronRight, Paperclip, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import SkillTag from '../components/SkillTag.jsx'
import { activeProjects, workspaceMessages, workspaceTasks } from '../mockData.js'

const milestones = ['Not Started', 'In Progress', 'Under Review', 'Completed']

export default function Workspace() {
  const { projectId } = useParams()
  const project = activeProjects.find((item) => item.id === projectId)
  const [tasks, setTasks] = useState(workspaceTasks)
  const [messages, setMessages] = useState(workspaceMessages)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState(1)
  const completedTasks = tasks.filter((task) => task.status === 'Completed').length
  const progress = Math.round((completedTasks / tasks.length) * 100)

  function advanceTask(taskId) {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task
      const status = task.status === 'Completed' ? 'Not Started' : 'Completed'
      return { ...task, status }
    }))
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessages((current) => [...current, {
      id: Date.now(),
      sender: 'Alex Morgan',
      role: 'You',
      text,
      time: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date()),
      color: 'bg-amber-100 text-amber-900',
    }])
    setMessage('')
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Workspace not found</h1>
        <p className="mt-2 text-sm text-slate-600">This project workspace is not available.</p>
        <Link to="/student/dashboard" className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/student/dashboard" className="text-xs font-semibold text-teal-700 hover:text-teal-900">← Back to dashboard</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{project.title}</h1>
            <Badge>In Progress</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{project.client} · Due {project.deadline}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((skill) => <SkillTag key={skill} variant="teal">{skill}</SkillTag>)}
        </div>
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-slate-900">Project journey</p><p className="mt-1 text-xs text-slate-500">Track progress from kickoff to delivery.</p></div>
          <span className="text-xs font-semibold text-teal-800">{milestones[stage]}</span>
        </div>
        <div className="relative grid grid-cols-4 gap-2">
          <div className="absolute left-[12%] right-[12%] top-4 hidden h-0.5 bg-slate-200 sm:block" />
          <div className="absolute left-[12%] top-4 hidden h-0.5 bg-teal-600 transition-all sm:block" style={{ width: `${stage * 25}%` }} />
          {milestones.map((milestone, index) => {
            const isComplete = index < stage
            const isActive = index === stage
            return (
              <button type="button" key={milestone} onClick={() => setStage(index)} aria-current={isActive ? 'step' : undefined} className="relative flex flex-col items-center gap-2 text-center">
                <span className={`grid size-8 place-items-center rounded-full text-xs font-bold ring-4 ring-white ${isComplete || isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {isComplete ? <Check size={15} /> : index + 1}
                </span>
                <span className={`text-[10px] font-semibold sm:text-xs ${isActive ? 'text-teal-800' : 'text-slate-500'}`}>{milestone}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:px-6">
            <div><h2 className="font-bold text-slate-900">Project tasks</h2><p className="mt-1 text-xs text-slate-500">{completedTasks} of {tasks.length} tasks completed</p></div>
            <span className="text-lg font-bold text-teal-800">{progress}%</span>
          </div>
          <div className="px-5 pt-4 sm:px-6"><ProgressBar value={progress} /></div>
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const isComplete = task.status === 'Completed'
              return (
                <div key={task.id} className="flex items-start gap-3 p-5 sm:px-6">
                  <button type="button" onClick={() => advanceTask(task.id)} aria-label={`${isComplete ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={isComplete} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${isComplete ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-transparent hover:border-teal-600'}`}>
                    <Check size={13} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${isComplete ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Assigned to {task.assignee}</span><span className="text-slate-300">·</span><span>Due {task.due}</span>
                    </div>
                  </div>
                  <Badge>{task.status}</Badge>
                </div>
              )
            })}
          </div>
          <button type="button" className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-4 text-sm font-semibold text-teal-700 hover:bg-slate-50 sm:px-6">
            View project files <ChevronRight size={16} />
          </button>
        </Card>

        <Card className="flex min-h-[580px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
            <div><h2 className="font-bold text-slate-900">Project chat</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><span className="size-1.5 rounded-full bg-emerald-500" /> Team &amp; client conversation</p></div>
            <div className="flex -space-x-2">
              <Avatar name="Alex Morgan" size="sm" color="bg-amber-100 text-amber-900 ring-2 ring-white" />
              <Avatar name="Maya Chen" size="sm" color="bg-blue-100 text-blue-800 ring-2 ring-white" />
              <Avatar name="Jordan Lee" size="sm" color="bg-indigo-100 text-indigo-800 ring-2 ring-white" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-slate-50/70 p-4 sm:p-5" aria-live="polite">
            <div className="self-center rounded-full bg-white px-3 py-1 text-[10px] font-medium text-slate-400 shadow-sm">Today · Project updates</div>
            {messages.map((chatMessage) => {
              const ownMessage = chatMessage.role === 'You'
              return (
                <div key={chatMessage.id} className={`flex max-w-[92%] gap-2.5 ${ownMessage ? 'ml-auto flex-row-reverse' : ''}`}>
                  <Avatar name={chatMessage.sender} size="sm" color={chatMessage.color} />
                  <div className={`min-w-0 ${ownMessage ? 'text-right' : ''}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[11px] ${ownMessage ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-slate-700">{chatMessage.sender}</span>
                      <span className="text-slate-400">{chatMessage.role} · {chatMessage.time}</span>
                    </div>
                    <div className={`rounded-2xl px-3.5 py-3 text-left text-sm leading-5 ${ownMessage ? 'rounded-tr-sm bg-teal-700 text-white' : 'rounded-tl-sm border border-slate-100 bg-white text-slate-700'}`}>
                      {chatMessage.text}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
            <button type="button" aria-label="Attach a file" className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Paperclip size={17} /></button>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Write a message</span>
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message your team..." className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            </label>
            <Button type="submit" aria-label="Send message" className="size-10 shrink-0 !p-0" disabled={!message.trim()}><Send size={16} /></Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
