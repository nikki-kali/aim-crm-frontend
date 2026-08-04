import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useToast } from './Toast'
import AnimatedModal from './AnimatedModal'
import { Target, Plus, X, User } from 'lucide-react'
import EmptyState from './EmptyState'

const METRIC_OPTIONS = [
  { value: 'leads_won', label: 'Leads Won' },
  { value: 'leads_contacted', label: 'Leads Contacted' },
  { value: 'proposals_sent', label: 'Proposals Sent' },
  { value: 'conversion_rate', label: '% Conversion Rate' },
]
const METRIC_LABELS = Object.fromEntries(METRIC_OPTIONS.map((m) => [m.value, m.label]))

function defaultPeriod() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { period_start: start.toISOString().slice(0, 10), period_end: end.toISOString().slice(0, 10) }
}

function ProgressBar({ goal }) {
  const pct = Math.min(goal.progress_pct || 0, 100)
  const isDone = pct >= 100
  const suffix = goal.metric === 'conversion_rate' ? '%' : ''
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{goal.title}</p>
        <span className={`text-xs font-bold flex-shrink-0 ${isDone ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
          {goal.current_value}{suffix} / {goal.target}{suffix}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : 'bg-[#06babe]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{METRIC_LABELS[goal.metric] || goal.metric} · through {goal.period_end}</p>
    </div>
  )
}

function GoalFormModal({ isAdmin, reps, onClose, onSaved }) {
  const [repId, setRepId] = useState(reps?.[0]?.id || '')
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState('leads_won')
  const [target, setTarget] = useState('')
  const period = defaultPeriod()
  const [periodStart, setPeriodStart] = useState(period.period_start)
  const [periodEnd, setPeriodEnd] = useState(period.period_end)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSave = async () => {
    if (!title.trim()) return setError('Title is required')
    if (!target || Number(target) <= 0) return setError('Target must be a positive number')
    if (isAdmin && !repId) return setError('Select a rep')
    setSaving(true)
    setError('')
    try {
      const body = { title: title.trim(), metric, target: Number(target), period: 'monthly', period_start: periodStart, period_end: periodEnd }
      if (isAdmin) {
        await api.post('/api/goals', { ...body, rep_id: repId })
      } else {
        await api.post('/api/goals/personal', body)
      }
      toast('Goal saved', 'success')
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save goal')
    }
    setSaving(false)
  }

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{isAdmin ? 'Assign Goal' : 'Add Personal Goal'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Goal'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        {isAdmin && (
          <div>
            <label className="label">Rep</label>
            <select className="input" value={repId} onChange={(e) => setRepId(e.target.value)}>
              {reps.map((r) => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Goal Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Close 10 leads this month" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Metric</label>
            <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Target</label>
            <input className="input" type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="10" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Period Start</label>
            <input className="input" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <label className="label">Period End</label>
            <input className="input" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
      </div>
    </AnimatedModal>
  )
}

export default function GoalsBoard({ isAdmin }) {
  const [data, setData] = useState(isAdmin ? [] : { admin_goals: [], personal_goals: [] })
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchGoals = async () => {
    setLoading(true)
    try {
      setData(await api.get(isAdmin ? '/api/goals/all' : '/api/goals/mine'))
    } catch {
      setData(isAdmin ? [] : { admin_goals: [], personal_goals: [] })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGoals()
    if (isAdmin) api.get('/api/users/reps').then((r) => setReps(r || [])).catch(() => {})
  }, [isAdmin])

  const handleSaved = () => { setShowModal(false); fetchGoals() }

  const goalsByRep = isAdmin
    ? data.reduce((acc, g) => {
        (acc[g.rep_id] ||= { rep_name: g.rep_name || g.rep_email, goals: [] }).goals.push(g)
        return acc
      }, {})
    : null

  return (
    <motion.div
      data-tour="dashboard-goals-board"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-[#06babe]" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isAdmin ? 'Team Goals' : 'My Goals'}</h2>
        </div>
        <button data-tour="goals-add-button" onClick={() => setShowModal(true)} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
          <Plus size={13} /> {isAdmin ? 'Assign Goal' : 'Add Goal'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
      ) : isAdmin ? (
        Object.keys(goalsByRep).length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Assign a goal to a rep to start tracking progress." size="sm" />
        ) : (
          <div className="space-y-4">
            {Object.entries(goalsByRep).map(([repId, { rep_name, goals }]) => (
              <div key={repId} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User size={11} /> {rep_name}
                </p>
                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {goals.map((g) => <ProgressBar key={g.id} goal={g} />)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (data.admin_goals.length === 0 && data.personal_goals.length === 0) ? (
        <EmptyState icon={Target} title="No goals yet" description="Add a personal goal to start tracking your progress." size="sm" />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {data.admin_goals.map((g) => <ProgressBar key={g.id} goal={g} />)}
          {data.personal_goals.map((g) => <ProgressBar key={g.id} goal={g} />)}
        </div>
      )}

      {showModal && (
        <GoalFormModal isAdmin={isAdmin} reps={reps} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </motion.div>
  )
}
