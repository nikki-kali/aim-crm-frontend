import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { Users, UserCheck, DollarSign, TrendingDown, AlertTriangle, RefreshCw, Globe, Linkedin, Facebook, Instagram, Twitter, CheckCircle, Archive } from 'lucide-react'

const SOURCE_ICON = {
  'LinkedIn':   { Icon: Linkedin,  cls: 'text-blue-600 bg-blue-50' },
  'Facebook':   { Icon: Facebook,  cls: 'text-blue-700 bg-blue-100' },
  'Instagram':  { Icon: Instagram, cls: 'text-pink-500 bg-pink-50' },
  'X (Twitter)':{ Icon: Twitter,   cls: 'text-gray-700 bg-gray-100' },
  'Website':    { Icon: Globe,     cls: 'text-teal-500 bg-teal-50' },
}

const BRAND_COLORS = {
  'Aim Dental': '#06babe',
  'Kings Highway': '#207290',
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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' } }),
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [coldLeads, setColdLeads] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [brandRevenue, setBrandRevenue] = useState([])
  const [intakeLeads, setIntakeLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [intakeActing, setIntakeActing] = useState({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/dashboard')
      setKpis(data.kpis)
      setColdLeads(data.cold_leads || [])
      setRecentLeads(data.recent_leads || [])
      setIntakeLeads(data.intake_leads || [])
      const grouped = (data.brand_revenue || []).reduce((acc, c) => {
        acc[c.brand] = (acc[c.brand] || 0) + Number(c.total_revenue)
        return acc
      }, {})
      setBrandRevenue(Object.entries(grouped).map(([brand, revenue]) => ({ brand, revenue })))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
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

  const kpiCards = kpis ? [
    { label: 'Active Leads',   value: kpis.active_leads,              icon: Users,        color: 'text-[#06babe]', bg: 'bg-teal-50' },
    { label: 'Total Clients',  value: kpis.total_clients,             icon: UserCheck,    color: 'text-[#207290]', bg: 'bg-blue-50' },
    { label: 'Total Revenue',  value: fmt(kpis.total_revenue),        icon: DollarSign,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Lost Leads',     value: kpis.lost_leads,                icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50' },
  ] : []

  const totalRev = brandRevenue.reduce((s, b) => s + b.revenue, 0)

  const statusClass = {
    Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
    Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending',
  }

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
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of both brands</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Intake Feed */}
      {intakeLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
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
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
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

      {/* Bottom 3-col grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue by Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.4 }}
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
                      <p className="text-xs text-gray-400">{lead.clinic_name}</p>
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.4 }}
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
                  <p className="text-xs text-gray-400">{lead.case_interest}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusClass[lead.status] || 'status-lead'}`}>
                  {lead.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
