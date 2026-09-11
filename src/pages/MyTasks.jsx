import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Square, MapPin, ListChecks, Plus } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { SkeletonCards } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import TaskModal from '../components/TaskModal'

// due_date arrives as a plain YYYY-MM-DD string (see tasks.js's /my route) —
// parsed via Date(y, m-1, d) rather than new Date(str), since the latter
// treats a bare date string as UTC midnight and can render as the previous
// day once toLocaleDateString() converts back to the browser's local zone.
const fmtDate = dateStr => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 }
const PRIORITY_DOT = { high: 'bg-red-500', normal: 'bg-[#057a7e]', low: 'bg-slate-300 dark:bg-slate-600' }

// Overdue/Today/Upcoming groups first (unchanged), high-priority tasks
// sorted first within each group.
function groupTasks(tasks) {
  const today = todayStr()
  const groups = { overdue: [], today: [], upcoming: [], noDate: [] }
  for (const t of tasks) {
    if (!t.due_date) groups.noDate.push(t)
    else if (t.due_date < today) groups.overdue.push(t)
    else if (t.due_date === today) groups.today.push(t)
    else groups.upcoming.push(t)
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1))
  }
  return groups
}

function TaskRow({ task, onToggle, onEdit, overdue }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
      overdue ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/40'
              : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'
    }`} onClick={() => onEdit(task)}>
      <button onClick={e => { e.stopPropagation(); onToggle(task) }} className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-[#057a7e]">
        {task.completed ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
      </button>
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.normal}`} title={`${task.priority || 'normal'} priority`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
        {task.client_name && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.client_name}</p>
        )}
        {task.client_address && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1 truncate">
            <MapPin size={11} className="flex-shrink-0" />
            {task.client_address}
          </p>
        )}
        {task.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{task.notes}</p>
        )}
      </div>
      {task.due_date && (
        <span className={`text-[10px] font-medium flex-shrink-0 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
          {fmtDate(task.due_date)}
        </span>
      )}
    </div>
  )
}

function Section({ title, tasks, onToggle, onEdit, overdue }) {
  if (tasks.length === 0) return null
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 px-1">
        {title} <span className="text-slate-300 dark:text-slate-600">({tasks.length})</span>
      </h2>
      <div className="space-y-2">
        {tasks.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} overdue={overdue} />)}
      </div>
    </div>
  )
}

export default function MyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalTask, setModalTask] = useState(undefined) // undefined = closed, null = create, object = edit

  const load = () => {
    setLoading(true)
    api.get('/api/tasks/my').then(setTasks).finally(() => setLoading(false))
  }

  useEffect(load, [])
  useEffect(() => {
    // Scoped to the current user's own clients already (GET /api/clients
    // applies isScopedRole server-side) — an admin viewing this page would
    // see every client, same as elsewhere in the app.
    api.get('/api/clients').then(data => setClients(data || [])).catch(() => {})
  }, [])

  const toggle = async (task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    await api.put(`/api/tasks/${task.id}`, { ...task, completed: true }).catch(() => load())
  }

  const groups = groupTasks(tasks)
  const isEmpty = !loading && tasks.length === 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Tasks</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Everything assigned to you, across clients, sorted by due date.
          </p>
        </div>
        <button onClick={() => setModalTask(null)} className="btn-primary text-sm flex-shrink-0 flex items-center gap-1.5">
          <Plus size={15} /> Add Task
        </button>
      </motion.div>

      {loading && <SkeletonCards rows={4} />}

      {isEmpty && (
        <EmptyState
          icon={ListChecks}
          title="No open tasks"
          description="Add one above, or have an admin assign one to you from a client's Tasks tab."
        />
      )}

      {!loading && !isEmpty && (
        <div className="space-y-6">
          <Section title="Overdue" tasks={groups.overdue} onToggle={toggle} onEdit={setModalTask} overdue />
          <Section title="Today" tasks={groups.today} onToggle={toggle} onEdit={setModalTask} />
          <Section title="Upcoming" tasks={groups.upcoming} onToggle={toggle} onEdit={setModalTask} />
          <Section title="No due date" tasks={groups.noDate} onToggle={toggle} onEdit={setModalTask} />
        </div>
      )}

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          clients={clients}
          canAssign={false}
          currentUserId={user.id}
          onClose={() => setModalTask(undefined)}
          onSaved={load}
        />
      )}
    </div>
  )
}
