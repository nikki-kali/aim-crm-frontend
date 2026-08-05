import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  Users, UserCheck, DollarSign, TrendingDown, AlertTriangle, RefreshCw,
  Globe, Linkedin, Facebook, Instagram, Twitter, Mail, CheckCircle, Archive,
  ClipboardList, Trophy, FileText, Target, ArrowUpRight,
  ArrowDownRight, Minus, GraduationCap,
} from 'lucide-react'
import { SkeletonCard, SkeletonKpiCards } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { normalizeSource } from '../lib/leadSource'
import AnimatedModal from '../components/AnimatedModal'
import { useTour } from '../context/TourContext'
import GoalsBoard from '../components/GoalsBoard'

const SOURCE_ICON = {
  'LinkedIn':                 { Icon: Linkedin,  cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
  'Facebook':                 { Icon: Facebook,  cls: 'text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-400' },
  'Instagram':                { Icon: Instagram, cls: 'text-pink-500 bg-pink-50 dark:bg-pink-950 dark:text-pink-400' },
  'X':                        { Icon: Twitter,   cls: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
  'Email':                    { Icon: Mail,      cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400' },
  'Email Marketing':          { Icon: Mail,      cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400' },
  'Website Form Submission':  { Icon: Globe,     cls: 'text-teal-500 bg-teal-50 dark:bg-teal-950 dark:text-teal-400' },
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

function useCountUp(target, duration = 900) {
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

function TrendBadge({ trend }) {
  if (!trend || trend === 'flat') return <Minus size={12} className="trend-flat" />
  if (trend === 'up') return <ArrowUpRight size={13} className="trend-up" />
  return <ArrowDownRight size={13} className="trend-down" />
}

function SparkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-lg">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{payload[0].value}</p>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, color, bg, bgDark, delay = 0, trend, sparkData, sparkColor }) {
  const animated = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card p-5 hover:shadow-card-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{animated}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl ${bg} dark:${bgDark || 'bg-slate-800'} flex items-center justify-center flex-shrink-0`}>
          <Icon size={17} className={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mb-2">
          <TrendBadge trend={trend} />
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
            {trend === 'flat' ? 'No change' : trend === 'up' ? 'Trending up' : 'Trending down'}
          </span>
        </div>
      )}
      {sparkData && sparkData.length > 0 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparkColor || '#06babe'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={sparkColor || '#06babe'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<SparkTooltip />} />
              <Area
                type="monotone" dataKey="v"
                stroke={sparkColor || '#06babe'} strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                dot={false} activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

// ── Rep Dashboard ──────────────────────────────────────────────────────────────

function RepDashboard({ user }) {
  const [summary,      setSummary]     = useState(null)
  const [weeklyFocus,  setWeeklyFocus] = useState('')
  const [focusSaved,   setFocusSaved]  = useState(false)
  const [loading,      setLoading]     = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sum, wf] = await Promise.all([
        api.get('/api/reports/my-summary'),
        api.get('/api/weekly-focus'),
      ])
      setSummary(sum)
      setWeeklyFocus(wf?.focus_text || '')
    } catch (err) {
      console.error('Rep dashboard error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const saveWeeklyFocus = async (val) => {
    if (!val.trim()) return
    await api.post('/api/weekly-focus', { focus_text: val }).catch(console.error)
    setFocusSaved(true)
    setTimeout(() => setFocusSaved(false), 2500)
  }

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const motivational = MOTIVATIONAL[new Date().getDay()]
  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const m = summary?.month || {}
  const kpiCards = summary ? [
    { label: 'Active Leads',    value: summary.allTime?.active_leads ?? 0, icon: Users,        color: 'text-[#06babe]', bg: 'bg-teal-50', trend: 'flat' },
    { label: `Wins — ${monthLabel}`, value: m.wins || 0,                  icon: Trophy,       color: 'text-emerald-600', bg: 'bg-emerald-50', trend: (m.wins || 0) > 0 ? 'up' : 'flat' },
    { label: 'Proposals',       value: m.proposals || 0,                  icon: FileText,     color: 'text-blue-600', bg: 'bg-blue-50', trend: 'flat' },
    { label: 'Conversion Rate', value: `${m.conversion_rate || 0}%`,      icon: TrendingDown, color: 'text-violet-600', bg: 'bg-violet-50', trend: (m.conversion_rate || 0) >= 30 ? 'up' : 'down' },
  ] : []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 italic">{motivational}</p>
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
        <div className="flex items-center gap-2 mb-2.5">
          <Target size={14} className="text-[#06babe]" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Focus This Week</h2>
          {focusSaved && <span className="text-xs text-emerald-600 font-semibold ml-auto">Saved ✓</span>}
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
      {loading ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div data-tour="dashboard-kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((card, i) => (
            <KpiCard key={card.label} {...card} delay={i * 0.08} />
          ))}
        </div>
      )}

      {/* Goals */}
      <GoalsBoard isAdmin={false} />

      {/* Recent Leads */}
      {!loading && summary?.recent_leads?.length > 0 && (
        <motion.div
          data-tour="dashboard-recent-leads"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.35 }}
          className="card p-5"
        >
          <div className="section-header">
            <h2 className="section-title">My Recent Leads</h2>
            <Link to="/leads" className="text-xs text-[#06babe] hover:underline font-medium">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {summary.recent_leads.map((lead, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex items-center gap-3 text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                  {(lead.doctor_name || '?').split(' ').pop()[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                  <p className="text-xs text-slate-400">{lead.clinic_name || lead.case_interest || '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_CLASSES[lead.status] || ''}`}>
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
  const [kpis,         setKpis]        = useState(null)
  const [coldLeads,    setColdLeads]   = useState([])
  const [recentLeads,  setRecentLeads] = useState([])
  const [brandRevenue, setBrandRevenue]= useState([])
  const [intakeLeads,  setIntakeLeads] = useState([])
  const [casePipeline, setCasePipeline]= useState([])
  const [teamStats,    setTeamStats]   = useState([])
  const [loading,      setLoading]     = useState(true)
  const [intakeActing, setIntakeActing]= useState({})
  const [teamPeriod,   setTeamPeriod]  = useState('month')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [data, team] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/reports/team-comparison').catch(() => []),
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
    } catch (err) {
      console.error('Admin dashboard error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

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

  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const kpiCards = kpis ? [
    { label: 'Active Leads',  value: kpis.active_leads,       icon: Users,        color: 'text-[#06babe]',   bg: 'bg-teal-50',    trend: 'up' },
    { label: 'Total Clients', value: kpis.total_clients,      icon: UserCheck,    color: 'text-[#207290]',   bg: 'bg-blue-50',    trend: 'up' },
    { label: 'Total Revenue', value: fmt(kpis.total_revenue), icon: DollarSign,   color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
    { label: 'Lost Leads',    value: kpis.lost_leads,         icon: TrendingDown, color: 'text-red-500',     bg: 'bg-red-50',     trend: kpis.lost_leads > 0 ? 'down' : 'flat' },
  ] : []

  const totalRev = brandRevenue.reduce((s, b) => s + b.revenue, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{monthLabel} overview · both brands</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((card, i) => (
            <KpiCard key={card.label} {...card} delay={i * 0.08} />
          ))}
        </div>
      )}

      {/* Rep Performance */}
      {!loading && teamStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}
          className="card p-5"
        >
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[#06babe]" />
              <h2 className="section-title">Rep Performance</h2>
            </div>
            <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              {['week', 'month', 'quarter'].map(p => (
                <button
                  key={p}
                  onClick={() => setTeamPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                    teamPeriod === p
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="data-table">
              <thead>
                <tr>
                  {['Rep', 'Leads', 'Wins', 'Proposals', 'Conv. Rate'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamStats.map(({ rep, ...periods }) => {
                  const s = periods[teamPeriod] || {}
                  return (
                    <tr key={rep.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(rep.name || rep.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.name || rep.email}</span>
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400">{s.leads_assigned ?? 0}</td>
                      <td><span className="font-bold text-emerald-600">{s.leads_won ?? 0}</span></td>
                      <td className="text-slate-600 dark:text-slate-400">{s.proposals_sent ?? 0}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${(s.conversion_rate ?? 0) >= 30 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {s.conversion_rate ?? 0}%
                          </span>
                          {(s.conversion_rate ?? 0) >= 30
                            ? <ArrowUpRight size={12} className="text-emerald-500" />
                            : <ArrowDownRight size={12} className="text-red-400" />}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Goals */}
      <GoalsBoard isAdmin={true} />

      {/* Intake Feed */}
      {!loading && intakeLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
          className="card p-5"
        >
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-[#06babe]" />
              <h2 className="section-title">Intake Feed</h2>
              <span className="bg-[#06babe]/10 text-[#06babe] text-xs font-bold px-2 py-0.5 rounded-full">
                {intakeLeads.length} new
              </span>
            </div>
            <span className="text-xs text-slate-400">Last 7 days · web &amp; social</span>
          </div>
          <div className="space-y-1">
            {intakeLeads.map((lead, i) => {
              const src = SOURCE_ICON[normalizeSource(lead.lead_source || lead.referral_source)] || { Icon: Globe, cls: 'text-slate-400 bg-slate-100 dark:bg-slate-800' }
              const acting = intakeActing[lead.id]
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${src.cls}`}>
                    <src.Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{lead.doctor_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {lead.case_interest || 'No case specified'} · {timeAgo(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => handleIntakeAction(lead, 'approve')} disabled={!!acting}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40">
                      <CheckCircle size={12} />
                      {acting === 'approve' ? '…' : 'Approve'}
                    </button>
                    <button onClick={() => handleIntakeAction(lead, 'archive')} disabled={!!acting}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40">
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
      {!loading && casePipeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
          className="card p-5"
        >
          <div className="section-header">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-[#06babe]" />
              <h2 className="section-title">Active Case Pipeline</h2>
            </div>
            <span className="text-xs text-slate-400">{casePipeline.reduce((s, c) => s + Number(c.count), 0)} open cases</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {casePipeline.map(({ status, count }) => (
              <div key={status} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight font-medium">{status}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom 3-col grid */}
      {!loading && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Revenue by Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
            className="card p-5"
          >
            <h2 className="section-title mb-4">Revenue by Brand</h2>
            {brandRevenue.length === 0 ? (
              <EmptyState icon={DollarSign} title="No revenue data yet" size="sm" />
            ) : (
              <div className="space-y-4">
                {brandRevenue.map(({ brand, revenue }) => {
                  const pct = totalRev > 0 ? Math.round((revenue / totalRev) * 100) : 0
                  return (
                    <div key={brand}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{brand}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {fmt(revenue)} <span className="text-xs text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
                          style={{ backgroundColor: BRAND_COLORS[brand] || '#06babe' }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Total</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(totalRev)}</span>
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
            <div className="section-header mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                <h2 className="section-title">Cold Leads</h2>
              </div>
              {coldLeads.length > 0 && (
                <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-100 dark:border-amber-900">
                  {coldLeads.length} need follow-up
                </span>
              )}
            </div>
            {coldLeads.length === 0 ? (
              <EmptyState icon={CheckCircle} title="No cold leads" description="Great job staying on top of your pipeline!" size="sm" />
            ) : (
              <div className="space-y-2.5">
                {coldLeads.slice(0, 4).map((lead, i) => {
                  const days = lead.last_contacted_at
                    ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000) : '?'
                  return (
                    <motion.div key={lead.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      className="flex items-center gap-3 text-sm p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400">
                        {lead.doctor_name.split(' ').pop()[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                        <p className="text-xs text-slate-400">{lead.assigned_to_name || lead.clinic_name}</p>
                      </div>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">{days}d</span>
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
            <div className="section-header mb-4">
              <h2 className="section-title">Recent Leads</h2>
              <Link to="/leads" className="text-xs text-[#06babe] hover:underline font-medium">View all →</Link>
            </div>
            {recentLeads.length === 0 ? (
              <EmptyState icon={Users} title="No leads yet" description="Add your first lead to get started." size="sm" />
            ) : (
              <div className="space-y-2.5">
                {recentLeads.map((lead, i) => (
                  <motion.div key={lead.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                    className="flex items-center gap-3 text-sm p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                      {lead.doctor_name.split(' ').pop()[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                      <p className="text-xs text-slate-400">{lead.case_interest || lead.assigned_to_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_CLASSES[lead.status] || 'status-lead'}`}>
                      {lead.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ── First-run tour nudge ─────────────────────────────────────────────────────

function WelcomeTourNudge() {
  const tour = useTour()
  const [dismissed, setDismissed] = useState(false)

  if (!tour?.progressLoaded || dismissed) return null
  const alreadyOffered = tour.completed.some((c) => c.item_type === 'tour')
  if (alreadyOffered) return null

  const handleDismiss = () => {
    setDismissed(true)
    tour.markComplete('tour', 'welcome-dismissed')
  }

  return (
    <AnimatedModal onClose={handleDismiss} maxWidth="sm">
      <div className="p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#06babe]/10 flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={26} className="text-[#06babe]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1.5">New here? Take a quick tour</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          We'll walk you through every part of the CRM, page by page — takes a few minutes. You can also find this later under Help &gt; Training.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDismiss} className="btn-secondary flex-1">Maybe later</button>
          <button
            onClick={() => { setDismissed(true); tour.markComplete('tour', 'welcome-dismissed'); tour.startFullTour() }}
            className="btn-primary flex-1"
          >
            Take the tour
          </button>
        </div>
      </div>
    </AnimatedModal>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <>
      {user.role !== 'admin' ? <RepDashboard user={user} /> : <AdminDashboard />}
      <WelcomeTourNudge />
    </>
  )
}
