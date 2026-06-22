import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  Users, UserCheck, DollarSign, TrendingDown, AlertTriangle, RefreshCw,
  Globe, Linkedin, Facebook, Instagram, Twitter, CheckCircle, Archive,
  ClipboardList, Trophy, FileText, Target, Plus, Trash2,
} from 'lucide-react'

const SOURCE_ICON = {
  'LinkedIn':    { Icon: Linkedin,  cls: 'text-blue-600 bg-blue-50' },
  'Facebook':    { Icon: Facebook,  cls: 'text-blue-700 bg-blue-100' },
  'Instagram':   { Icon: Instagram, cls: 'text-pink-500 bg-pink-50' },
  'X (Twitter)': { Icon: Twitter,   cls: 'text-gray-700 bg-gray-100' },
  'Website':     { Icon: Globe,     cls: 'text-teal-500 bg-teal-50' },
}

const BRAND_COLORS = { 'Aim Dental': '#06babe', 'Kings Highway': '#207290' }

const STATUS_CLASSES = {
  Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
  Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending',
}

const MOTIVATIONAL = [
  'Every no is one step closer to a yes.',
  'The best time to plant a tree was yesterday. The second best time is now.',
  'Consistency beats perfection every time.',
  'Small daily progress leads to big results.',
  'Your attitude determines your direction.',
  "Today's actions are tomorrow's results.",
  'Focus on progress, not perfection.',
]

const METRIC_LABELS = {
  leads_won: 'Leads Won',
  leads_contacted: 'Leads Contacted',
  proposals_sent: 'Proposals Sent',
  conversion_rate: '% Conv. Rate',
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' } }),
}

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ''))
    if (isNaN(num) || num === 0) { setValue(target); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * num)
      setValue(typeof target === 'string' && target.startsWith('$')
        ? `$${current.toLocaleString()}`
        : current
      )
      if (progress < 1) raf.current = requestAnimationFrame(step)
      else setValue(target)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return value
}

function KpiCard({ label, value, icon: Icon, color, bg, delay = 0 }) {
  const animated = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{animated}</p>
    </motion.div>
  )
}

function GoalBar({ goal }) {
  const pct = goal.progress_pct || 0
  const days = goal.period_end
    ? Math.ceil((new Date(goal.period_end) - new Date()) / 86400000)
    : null
  const urgent = days !== null && days <= 2 && pct < 80
  const barCls = pct >= 100 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-400' : 'bg-[#06babe]'
  const isPersonal = !goal.created_by

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate">{goal.title}</span>
          {isPersonal && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">Personal</span>
          )}
          {urgent && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium shrink-0">
              {days}d left
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {pct >= 100 ? (
            <span className="text-xs font-semibold text-green-600">Goal reached!</span>
          ) : (
            <span className="text-xs text-gray-500">
              {goal.current_value}/{goal.target} {METRIC_LABELS[goal.metric] || goal.metric}
            </span>
          )}
          <span className="text-xs font-semibold text-gray-700">{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barCls}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ── Rep Dashboard ──────────────────────────────────────────────────────────────

function getPeriodDates(period) {
  const now = new Date()
  if (period === 'weekly') {
    const d = new Date(now)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    const start = d.toISOString().split('T')[0]
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6).toISOString().split('T')[0]
    return { period_start: start, period_end: end }
  }
  if (period === 'monthly') {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    return { period_start: start, period_end: end }
  }
  // quarterly
  const q = Math.floor(now.getMonth() / 3)
  const start = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0]
  return { period_start: start, period_end: end }
}

function RepDashboard({ user }) {
  const [summary,      setSummary]     = useState(null)
  const [goals,        setGoals]       = useState({ admin_goals: [], personal_goals: [] })
  const [weeklyFocus,  setWeeklyFocus] = useState('')
  const [focusSaved,   setFocusSaved]  = useState(false)
  const [loading,      setLoading]     = useState(true)
  const [addingGoal,   setAddingGoal]  = useState(false)
  const [newGoal,      setNewGoal]     = useState({ title: '', metric: 'leads_won', target: '', period: 'monthly' })
  const [savingGoal,   setSavingGoal]  = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sum, g, wf] = await Promise.all([
        api.get('/api/reports/my-summary'),
        api.get('/api/goals/mine'),
        api.get('/api/weekly-focus'),
      ])
      setSummary(sum)
      setGoals(g || { admin_goals: [], personal_goals: [] })
      setWeeklyFocus(wf?.focus || '')
    } catch (err) {
      console.error('Rep dashboard error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const saveWeeklyFocus = async (val) => {
    if (!val.trim()) return
    await api.post('/api/weekly-focus', { focus: val }).catch(console.error)
    setFocusSaved(true)
    setTimeout(() => setFocusSaved(false), 2500)
  }

  const handleAddPersonalGoal = async () => {
    if (!newGoal.title || !newGoal.target) return
    setSavingGoal(true)
    const { period_start, period_end } = getPeriodDates(newGoal.period)
    await api.post('/api/goals/personal', { ...newGoal, period_start, period_end }).catch(console.error)
    const g = await api.get('/api/goals/mine').catch(() => goals)
    setGoals(g || goals)
    setAddingGoal(false)
    setNewGoal({ title: '', metric: 'leads_won', target: '', period: 'monthly' })
    setSavingGoal(false)
  }

  const handleDeletePersonalGoal = async (id) => {
    await api.delete(`/api/goals/personal/${id}`).catch(console.error)
    setGoals(g => ({
      ...g,
      personal_goals: g.personal_goals.filter(p => p.id !== id),
    }))
  }

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const motivational = MOTIVATIONAL[new Date().getDay()]

  const allGoals = [...(goals.admin_goals || []), ...(goals.personal_goals || [])]
  const m = summary?.month || {}
  const kpiCards = summary ? [
    { label: 'My Active Leads',   value: summary.allTime?.active_leads ?? 0,   icon: Users,     color: 'text-[#06babe]', bg: 'bg-teal-50' },
    { label: 'Wins This Month',   value: m.wins || 0,                           icon: Trophy,    color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Proposals Month',   value: m.proposals || 0,                      icon: FileText,  color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Conversion Rate',   value: `${m.conversion_rate || 0}%`,          icon: TrendingDown, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : []

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <RefreshCw className="mx-auto mb-2 animate-spin" size={24} />
        <p className="text-sm">Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 italic">{motivational}</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Weekly Focus */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
        className="card p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Target size={14} className="text-[#06babe]" />
          <h2 className="text-sm font-semibold text-gray-900">My Focus This Week</h2>
          {focusSaved && <span className="text-xs text-green-600 font-medium ml-auto">Saved ✓</span>}
        </div>
        <input
          className="input text-sm"
          placeholder="What's your main goal this week?"
          value={weeklyFocus}
          onChange={e => setWeeklyFocus(e.target.value)}
          onBlur={() => saveWeeklyFocus(weeklyFocus)}
          onKeyDown={e => e.key === 'Enter' && saveWeeklyFocus(weeklyFocus)}
        />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Goal Progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-[#06babe]" />
            <h2 className="text-sm font-semibold text-gray-900">Goals</h2>
            {allGoals.length > 0 && (
              <span className="text-xs bg-[#06babe]/10 text-[#06babe] px-2 py-0.5 rounded-full font-medium">
                {allGoals.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setAddingGoal(v => !v)}
            className="text-xs text-[#06babe] hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Add personal goal
          </button>
        </div>

        {addingGoal && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <input
              className="input text-sm"
              placeholder="Goal title (e.g. Close 3 wins this month)"
              value={newGoal.title}
              onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <select className="input text-sm" value={newGoal.metric} onChange={e => setNewGoal(g => ({ ...g, metric: e.target.value }))}>
                <option value="leads_won">Leads Won</option>
                <option value="leads_contacted">Leads Contacted</option>
                <option value="proposals_sent">Proposals Sent</option>
                <option value="conversion_rate">Conv. Rate %</option>
              </select>
              <input
                className="input text-sm"
                type="number"
                placeholder="Target"
                value={newGoal.target}
                onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))}
              />
              <select className="input text-sm" value={newGoal.period} onChange={e => setNewGoal(g => ({ ...g, period: e.target.value }))}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddingGoal(false)} className="btn-secondary text-sm flex-1">Cancel</button>
              <button onClick={handleAddPersonalGoal} disabled={savingGoal} className="btn-primary text-sm flex-1 disabled:opacity-50">
                {savingGoal ? 'Saving…' : 'Save Goal'}
              </button>
            </div>
          </div>
        )}

        {allGoals.length === 0 && !addingGoal ? (
          <div className="text-center py-6">
            <Trophy size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No goals yet — your admin may set some, or add a personal goal above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allGoals.map(goal => (
              <div key={goal.id} className="relative group">
                <GoalBar goal={goal} />
                {!goal.created_by && (
                  <button
                    onClick={() => handleDeletePersonalGoal(goal.id)}
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Leads */}
      {summary?.recent_leads?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.35 }}
          className="card p-5"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">My Recent Leads</h2>
          <div className="space-y-2.5">
            {summary.recent_leads.map((lead, i) => (
              <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="show"
                className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                  {(lead.doctor_name || '?').split(' ').pop()[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{lead.doctor_name}</p>
                  <p className="text-xs text-gray-400">{lead.clinic_name || lead.case_interest || '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CLASSES[lead.status] || ''}`}>
                  {lead.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [kpis,          setKpis]         = useState(null)
  const [coldLeads,     setColdLeads]    = useState([])
  const [recentLeads,   setRecentLeads]  = useState([])
  const [brandRevenue,  setBrandRevenue] = useState([])
  const [intakeLeads,   setIntakeLeads]  = useState([])
  const [casePipeline,  setCasePipeline] = useState([])
  const [teamStats,     setTeamStats]    = useState([])
  const [allGoals,      setAllGoals]     = useState([])
  const [reps,          setReps]         = useState([])
  const [loading,       setLoading]      = useState(true)
  const [intakeActing,  setIntakeActing] = useState({})
  const [teamPeriod,    setTeamPeriod]   = useState('month')
  const [goalModal,     setGoalModal]    = useState(false)
  const [newGoalForm,   setNewGoalForm]  = useState({ rep_id: '', title: '', metric: 'leads_won', target: '', period: 'monthly' })
  const [savingGoal,    setSavingGoal]   = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [data, team, goals, repList] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/reports/team-comparison').catch(() => []),
        api.get('/api/goals/all').catch(() => []),
        api.get('/api/users/reps').catch(() => []),
      ])
      setKpis(data.kpis)
      setColdLeads(data.cold_leads || [])
      setRecentLeads(data.recent_leads || [])
      setIntakeLeads(data.intake_leads || [])
      setCasePipeline(data.case_pipeline || [])
      const grouped = (data.brand_revenue || []).reduce((acc, c) => {
        acc[c.brand] = (acc[c.brand] || 0) + Number(c.total_revenue)
        return acc
      }, {})
      setBrandRevenue(Object.entries(grouped).map(([brand, revenue]) => ({ brand, revenue })))
      setTeamStats(team || [])
      setAllGoals(goals || [])
      setReps(repList || [])
    } catch (err) {
      console.error('Admin dashboard error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateGoal = async () => {
    if (!newGoalForm.rep_id || !newGoalForm.title || !newGoalForm.target) return
    setSavingGoal(true)
    const { period_start, period_end } = getPeriodDates(newGoalForm.period)
    try {
      await api.post('/api/goals', { ...newGoalForm, period_start, period_end })
      const goals = await api.get('/api/goals/all').catch(() => allGoals)
      setAllGoals(goals || allGoals)
      setGoalModal(false)
      setNewGoalForm({ rep_id: '', title: '', metric: 'leads_won', target: '', period: 'monthly' })
    } catch (err) {
      console.error('Create goal error:', err)
    }
    setSavingGoal(false)
  }

  const handleDeleteGoal = async (id) => {
    await api.delete(`/api/goals/${id}`).catch(console.error)
    setAllGoals(g => g.filter(goal => goal.id !== id))
  }

  const fmt = (n) => `$${Number(n || 0).toLocaleString()}`

  const handleIntakeAction = async (lead, action) => {
    setIntakeActing(p => ({ ...p, [lead.id]: action }))
    const status = action === 'approve' ? 'Contacted' : 'Lost'
    await api.put(`/api/leads/${lead.id}`, { ...lead, status }).catch(console.error)
    setIntakeLeads(p => p.filter(l => l.id !== lead.id))
    setIntakeActing(p => { const n = { ...p }; delete n[lead.id]; return n })
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const kpiCards = kpis ? [
    { label: 'Active Leads',  value: kpis.active_leads,       icon: Users,        color: 'text-[#06babe]', bg: 'bg-teal-50' },
    { label: 'Total Clients', value: kpis.total_clients,      icon: UserCheck,    color: 'text-[#207290]', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: fmt(kpis.total_revenue), icon: DollarSign,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Lost Leads',    value: kpis.lost_leads,         icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50' },
  ] : []

  const totalRev = brandRevenue.reduce((s, b) => s + b.revenue, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <RefreshCw className="mx-auto mb-2 animate-spin" size={24} />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of both brands</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Rep Performance */}
      {teamStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[#06babe]" />
              <h2 className="text-sm font-semibold text-gray-900">Rep Performance</h2>
            </div>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
              {['week', 'month', 'quarter'].map(p => (
                <button
                  key={p}
                  onClick={() => setTeamPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    teamPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Rep', 'Leads', 'Wins', 'Proposals', 'Conv. Rate'].map(h => (
                    <th key={h} className="text-left pb-2 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamStats.map(({ rep, ...periods }) => {
                  const s = periods[teamPeriod] || {}
                  return (
                    <tr key={rep.id} className="hover:bg-gray-50/60">
                      <td className="py-2.5 font-medium text-gray-800">{rep.name || rep.email}</td>
                      <td className="py-2.5 text-gray-600">{s.leads_assigned ?? 0}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-green-600">{s.leads_won ?? 0}</span>
                      </td>
                      <td className="py-2.5 text-gray-600">{s.proposals_sent ?? 0}</td>
                      <td className="py-2.5">
                        <span className={`font-semibold ${(s.conversion_rate ?? 0) >= 30 ? 'text-green-600' : 'text-gray-700'}`}>
                          {s.conversion_rate ?? 0}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Goal Management */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-[#06babe]" />
            <h2 className="text-sm font-semibold text-gray-900">Goal Management</h2>
            {allGoals.length > 0 && (
              <span className="text-xs bg-[#06babe]/10 text-[#06babe] px-2 py-0.5 rounded-full font-medium">
                {allGoals.length} active
              </span>
            )}
          </div>
          <button
            onClick={() => setGoalModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={12} /> Set Goal
          </button>
        </div>

        {allGoals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No goals set. Click "Set Goal" to assign a goal to a rep.</p>
        ) : (
          <div className="space-y-4">
            {allGoals.map(goal => (
              <div key={goal.id} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#06babe] font-medium">{goal.rep_name}</span>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <GoalBar goal={goal} />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Intake Feed */}
      {intakeLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-[#06babe]" />
              <h2 className="text-sm font-semibold text-gray-900">Intake Feed</h2>
              <span className="bg-[#06babe]/10 text-[#06babe] text-xs font-semibold px-2 py-0.5 rounded-full">
                {intakeLeads.length} new
              </span>
            </div>
            <span className="text-xs text-gray-400">Last 7 days · web & social</span>
          </div>
          <div className="space-y-2">
            {intakeLeads.map((lead, i) => {
              const src = SOURCE_ICON[lead.lead_source || lead.referral_source] || { Icon: Globe, cls: 'text-gray-400 bg-gray-100' }
              const acting = intakeActing[lead.id]
              return (
                <motion.div
                  key={lead.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${src.cls}`}>
                    <src.Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.doctor_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {lead.case_interest || 'No case specified'} · {timeAgo(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => handleIntakeAction(lead, 'approve')} disabled={!!acting}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-40">
                      <CheckCircle size={12} />
                      {acting === 'approve' ? '…' : 'Approve'}
                    </button>
                    <button onClick={() => handleIntakeAction(lead, 'archive')} disabled={!!acting}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-40">
                      <Archive size={12} />
                      {acting === 'archive' ? '…' : 'Archive'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Case Pipeline Summary */}
      {casePipeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={15} className="text-[#06babe]" />
            <h2 className="text-sm font-semibold text-gray-900">Active Case Pipeline</h2>
            <span className="ml-auto text-xs text-gray-400">{casePipeline.reduce((s, c) => s + Number(c.count), 0)} open cases</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {casePipeline.map(({ status, count }) => (
              <div key={status} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{status}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom 3-col grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue by Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
          className="card p-5"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Brand</h2>
          {brandRevenue.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet</p>
          ) : (
            <div className="space-y-4">
              {brandRevenue.map(({ brand, revenue }) => {
                const pct = totalRev > 0 ? Math.round((revenue / totalRev) * 100) : 0
                return (
                  <div key={brand}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-700 font-medium">{brand}</span>
                      <span className="text-sm text-gray-500">{fmt(revenue)} <span className="text-xs text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        style={{ backgroundColor: BRAND_COLORS[brand] || '#06babe' }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total</span>
                  <span className="font-semibold text-gray-700">{fmt(totalRev)}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Cold Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48, duration: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Cold Leads</h2>
            {coldLeads.length > 0 && (
              <span className="ml-auto text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-100">
                {coldLeads.length} need follow-up
              </span>
            )}
          </div>
          {coldLeads.length === 0 ? (
            <p className="text-sm text-gray-400">No cold leads — great job!</p>
          ) : (
            <div className="space-y-3">
              {coldLeads.slice(0, 4).map((lead, i) => {
                const days = lead.last_contacted_at
                  ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000) : '?'
                return (
                  <motion.div key={lead.id} custom={i} variants={cardVariants} initial="hidden" animate="show"
                    className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">
                      {lead.doctor_name.split(' ').pop()[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{lead.doctor_name}</p>
                      <p className="text-xs text-gray-400">{lead.assigned_to_name || lead.clinic_name}</p>
                    </div>
                    <span className="text-xs text-amber-600 font-medium flex-shrink-0">{days}d ago</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56, duration: 0.4 }}
          className="card p-5"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {recentLeads.map((lead, i) => (
              <motion.div key={lead.id} custom={i} variants={cardVariants} initial="hidden" animate="show"
                className="flex items-center gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                  {lead.doctor_name.split(' ').pop()[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{lead.doctor_name}</p>
                  <p className="text-xs text-gray-400">{lead.case_interest || lead.assigned_to_name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CLASSES[lead.status] || 'status-lead'}`}>
                  {lead.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Set Goal Modal */}
      {goalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Set New Goal</h2>
              <button onClick={() => setGoalModal(false)} className="text-gray-400 hover:text-gray-600">
                <TrendingDown size={16} className="rotate-90" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Assign to Rep</label>
                <select className="input" value={newGoalForm.rep_id} onChange={e => setNewGoalForm(f => ({ ...f, rep_id: e.target.value }))}>
                  <option value="">— Select Rep —</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Goal Title</label>
                <input className="input" placeholder="e.g. Close 5 wins this month" value={newGoalForm.title} onChange={e => setNewGoalForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Metric</label>
                  <select className="input" value={newGoalForm.metric} onChange={e => setNewGoalForm(f => ({ ...f, metric: e.target.value }))}>
                    <option value="leads_won">Leads Won</option>
                    <option value="leads_contacted">Leads Contacted</option>
                    <option value="proposals_sent">Proposals Sent</option>
                    <option value="conversion_rate">Conv. Rate %</option>
                  </select>
                </div>
                <div>
                  <label className="label">Target</label>
                  <input className="input" type="number" placeholder="5" value={newGoalForm.target} onChange={e => setNewGoalForm(f => ({ ...f, target: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Period</label>
                <select className="input" value={newGoalForm.period} onChange={e => setNewGoalForm(f => ({ ...f, period: e.target.value }))}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">Period dates are computed automatically. An email will be sent to the rep.</p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setGoalModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreateGoal} disabled={savingGoal} className="btn-primary flex-1 disabled:opacity-50">
                {savingGoal ? 'Saving…' : 'Set Goal & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'staff') return <RepDashboard user={user} />
  return <AdminDashboard />
}
