import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { Send, X, Mail, FileDown, TrendingUp, Users, DollarSign, ArrowUpRight } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const DATE_PRESETS = [
  { id: 'all',    label: 'All Time' },
  { id: '7d',     label: '7 Days' },
  { id: '30d',    label: '30 Days' },
  { id: '90d',    label: '90 Days' },
  { id: 'ytd',    label: 'YTD' },
  { id: 'custom', label: 'Custom' },
]

function dateRangeBounds(dr) {
  const now = new Date()
  if (dr.preset === '7d')  return { from: new Date(now - 7*86400000).toISOString(), to: null }
  if (dr.preset === '30d') return { from: new Date(now - 30*86400000).toISOString(), to: null }
  if (dr.preset === '90d') return { from: new Date(now - 90*86400000).toISOString(), to: null }
  if (dr.preset === 'ytd') return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: null }
  if (dr.preset === 'custom') {
    return {
      from: dr.from ? new Date(dr.from).toISOString() : null,
      to:   dr.to   ? new Date(dr.to + 'T23:59:59.999').toISOString() : null,
    }
  }
  return { from: null, to: null }
}

const MY_REPORT_TAB = { id: 'my-report', label: 'My Report' }

const STAFF_TABS = [
  MY_REPORT_TAB,
  { id: 'overview',   label: 'Overview' },
  { id: 'trends',     label: 'Trends' },
  { id: 'sources',    label: 'Sources' },
  { id: 'performers', label: 'Top Performers' },
]

const ADMIN_TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'trends',     label: 'Trends' },
  { id: 'sources',    label: 'Sources' },
  { id: 'performers', label: 'Top Performers' },
  { id: 'operations', label: 'Operations' },
  { id: 'imports',    label: 'Import History' },
  { id: 'schedule',   label: 'Schedule' },
  MY_REPORT_TAB,
]

function TH({ cols }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
      {cols.map(h => (
        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
      ))}
    </tr>
  )
}

const ChartTooltipStyle = {
  contentStyle: {
    background: 'white', border: '1px solid #e2e8f0',
    borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  labelStyle: { fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  itemStyle: { color: '#475569' },
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ leads, clients }) {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const ytd = leads.filter(l => l.created_at >= yearStart)
  const won = ytd.filter(l => l.status === 'Won')
  const lost = ytd.filter(l => l.status === 'Lost')
  const active = ytd.filter(l => !['Won', 'Lost'].includes(l.status))
  const total = ytd.length

  const revenue = clients.reduce((s, c) => s + Number(c.total_revenue || 0), 0)
  const convRate = total > 0 ? ((won.length / total) * 100).toFixed(1) : '0'
  const lossRate = total > 0 ? ((lost.length / total) * 100).toFixed(1) : '0'

  const top5 = [...clients]
    .sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
    .slice(0, 5)

  const maxBar = Math.max(won.length, lost.length, active.length, 1)
  const bars = [
    { label: 'Won', count: won.length, color: '#22c55e' },
    { label: 'Lost', count: lost.length, color: '#ef4444' },
    { label: 'Active', count: active.length, color: '#94a3b8' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', val: `$${revenue.toLocaleString()}`, sub: 'All clients' },
          { label: 'YTD Leads', val: total, sub: String(new Date().getFullYear()) },
          { label: 'Conversion Rate', val: `${convRate}%`, sub: `${won.length} won` },
          { label: 'Loss Rate', val: `${lossRate}%`, sub: `${lost.length} lost` },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="label">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{k.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">YTD Win/Loss Breakdown</h3>
        {bars.every(b => b.count === 0) ? (
          <EmptyState icon={TrendingUp} title="No lead data yet" size="sm" />
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 4, right: 8, left: -20, bottom: 4 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...ChartTooltipStyle} formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}
                  label={{ position: 'top', fontSize: 11, fill: '#64748b', formatter: (v) => v > 0 ? v : '' }}
                >
                  {bars.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Top 5 Clients by Revenue</h3>
        </div>
        {top5.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No clients yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><TH cols={['#', 'Client', 'Brand', 'Revenue', 'Cases']} /></thead>
              <tbody className="divide-y divide-gray-50">
                {top5.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-xs font-medium text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.doctor_name}</p>
                      {c.clinic_name && <p className="text-xs text-gray-400">{c.clinic_name}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                        {c.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      ${Number(c.total_revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.case_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Period Charts (weekly / monthly / quarterly) ─────────────────────────────

function PeriodCharts({ leads }) {
  const [view, setView] = useState('all')

  const weeklyData = useMemo(() => {
    const byWeek = {}
    leads.forEach(l => {
      const d = new Date(l.created_at)
      const sun = new Date(d)
      sun.setDate(d.getDate() - d.getDay())
      sun.setHours(0, 0, 0, 0)
      const k = sun.toISOString().slice(0, 10)
      if (!byWeek[k]) byWeek[k] = { leads: 0, won: 0 }
      byWeek[k].leads++
      if (l.status === 'Won') byWeek[k].won++
    })
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const sun = new Date(now)
      sun.setDate(now.getDate() - now.getDay() - (11 - i) * 7)
      sun.setHours(0, 0, 0, 0)
      const k = sun.toISOString().slice(0, 10)
      return {
        label: sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...(byWeek[k] || { leads: 0, won: 0 }),
      }
    })
  }, [leads])

  const monthlyData = useMemo(() => {
    const byMonth = {}
    leads.forEach(l => {
      const d = new Date(l.created_at)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[k]) byMonth[k] = { leads: 0, won: 0 }
      byMonth[k].leads++
      if (l.status === 'Won') byMonth[k].won++
    })
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...(byMonth[k] || { leads: 0, won: 0 }),
      }
    })
  }, [leads])

  const quarterlyData = useMemo(() => {
    const byQ = {}
    leads.forEach(l => {
      const d = new Date(l.created_at)
      const q = Math.floor(d.getMonth() / 3) + 1
      const k = `${d.getFullYear()}-Q${q}`
      if (!byQ[k]) byQ[k] = { leads: 0, won: 0 }
      byQ[k].leads++
      if (l.status === 'Won') byQ[k].won++
    })
    const now = new Date()
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i) * 3, 1)
      const q = Math.floor(d.getMonth() / 3) + 1
      const k = `${d.getFullYear()}-Q${q}`
      return {
        label: `Q${q} '${String(d.getFullYear()).slice(2)}`,
        ...(byQ[k] || { leads: 0, won: 0 }),
      }
    })
  }, [leads])

  const periods = [
    { id: 'weekly',    label: 'Weekly',    sub: 'Last 12 weeks',   data: weeklyData },
    { id: 'monthly',   label: 'Monthly',   sub: 'Last 12 months',  data: monthlyData },
    { id: 'quarterly', label: 'Quarterly', sub: 'Last 8 quarters', data: quarterlyData },
  ]

  const shownPeriods = view === 'all' ? periods : periods.filter(p => p.id === view)

  const renderChart = (p, tall) => (
    <div className={tall ? 'h-64' : 'h-44'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={p.data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={`gl-${p.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06babe" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#06babe" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`gw-${p.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            interval={tall ? 0 : 'preserveStartEnd'} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...ChartTooltipStyle} />
          <Area type="monotone" dataKey="leads" name="Leads" stroke="#06babe" strokeWidth={2}
            fill={`url(#gl-${p.id})`} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="won" name="Won" stroke="#22c55e" strokeWidth={2}
            fill={`url(#gw-${p.id})`} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Period Comparison</h3>
        <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
          {[{ id: 'all', label: 'All' }, ...periods.map(p => ({ id: p.id, label: p.label }))].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === v.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={view === 'all' ? 'grid md:grid-cols-3 gap-5' : ''}>
        {shownPeriods.map(p => (
          <div key={p.id}>
            {view === 'all' ? (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{p.label}</p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{p.sub}</p>
            )}
            {renderChart(p, view !== 'all')}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-[#06babe]" /><span className="text-xs text-slate-500">Leads</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500">Won</span></div>
      </div>
    </div>
  )
}

// ─── Tab: Trends ──────────────────────────────────────────────────────────────

function TrendsTab({ leads }) {
  const byMonth = {}
  leads.forEach(l => {
    const d = new Date(l.created_at)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[k]) byMonth[k] = { leads: 0, won: 0, lost: 0, revenue: 0 }
    byMonth[k].leads++
    if (l.status === 'Won') { byMonth[k].won++; byMonth[k].revenue += Number(l.estimated_value || 0) }
    if (l.status === 'Lost') byMonth[k].lost++
  })

  const rows = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([k, d]) => {
      const [y, m] = k.split('-')
      const pct = d.leads > 0 ? (d.won / d.leads) * 100 : 0
      return { label: `${MONTHS[Number(m) - 1].slice(0, 3)} '${y.slice(2)}`, ...d, pct }
    })

  const tableRows = [...rows].reverse()

  return (
    <div className="space-y-5">
      <PeriodCharts leads={leads} />

      {rows.length === 0 ? (
        <div className="card p-5">
          <EmptyState icon={TrendingUp} title="No trend data yet" description="Data will appear as leads are added." size="sm" />
        </div>
      ) : (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Monthly Lead Volume — Last 12 Months</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-leads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06babe" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06babe" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-won" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...ChartTooltipStyle} />
                <Area type="monotone" dataKey="leads" name="Total Leads" stroke="#06babe" strokeWidth={2} fill="url(#grad-leads)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="won" name="Won" stroke="#22c55e" strokeWidth={2} fill="url(#grad-won)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 justify-end">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-[#06babe]" /><span className="text-xs text-slate-500">Total Leads</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500">Won</span></div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Breakdown — Last 12 Months</h3>
        </div>
        {tableRows.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No data available" size="sm" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><TH cols={['Month', 'Leads', 'Won', 'Lost', 'Est. Revenue', 'Conv. Rate']} /></thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">{r.label}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.leads}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">{r.won}</td>
                    <td className="px-5 py-3 text-red-500">{r.lost}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {r.revenue > 0 ? `$${r.revenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-bold text-xs ${r.pct >= 50 ? 'text-emerald-600' : r.pct > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {r.leads > 0 ? `${r.pct.toFixed(0)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Sources ─────────────────────────────────────────────────────────────

function SourcesTab({ leads }) {
  const bySource = {}
  leads.forEach(l => {
    const src = l.referral_source || 'Unknown'
    if (!bySource[src]) bySource[src] = { total: 0, won: 0, lost: 0 }
    bySource[src].total++
    if (l.status === 'Won') bySource[src].won++
    if (l.status === 'Lost') bySource[src].lost++
  })

  const totalLeads = leads.length
  const rows = Object.entries(bySource)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([src, d]) => ({
      src,
      ...d,
      pct: totalLeads > 0 ? (d.total / totalLeads) * 100 : 0,
      conv: d.total > 0 ? (d.won / d.total) * 100 : 0,
    }))

  const maxTotal = Math.max(...rows.map(r => r.total), 1)

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Lead Volume by Source</h3>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No source data yet" size="sm" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="src" width={90} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip {...ChartTooltipStyle} formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="total" fill="#06babe" radius={[0, 6, 6, 0]}
                  label={{ position: 'right', fontSize: 11, fill: '#94a3b8', formatter: (v) => v }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Source Breakdown</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <TH cols={['Source', 'Total Leads', 'Won', 'Lost', 'Active', 'Conv. Rate', 'Share']} />
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.src} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.src}</td>
                    <td className="px-5 py-3 text-gray-600">{r.total}</td>
                    <td className="px-5 py-3 font-medium text-green-600">{r.won}</td>
                    <td className="px-5 py-3 text-red-500">{r.lost}</td>
                    <td className="px-5 py-3 text-gray-500">{r.total - r.won - r.lost}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${r.conv >= 50 ? 'text-green-600' : r.conv > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {r.total > 0 ? `${r.conv.toFixed(0)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{r.pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Top Performers ──────────────────────────────────────────────────────

function PerformersTab({ leads, clients }) {
  const top10 = [...clients]
    .sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
    .slice(0, 10)

  const caseTypes = {}
  leads.forEach(l => {
    if (!l.case_interest) return
    if (!caseTypes[l.case_interest]) caseTypes[l.case_interest] = { count: 0, wonCount: 0, value: 0 }
    caseTypes[l.case_interest].count++
    if (l.status === 'Won') {
      caseTypes[l.case_interest].wonCount++
      caseTypes[l.case_interest].value += Number(l.estimated_value || 0)
    }
  })
  const caseRows = Object.entries(caseTypes)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, d]) => ({ type, ...d, conv: d.count > 0 ? (d.wonCount / d.count) * 100 : 0 }))

  const srcMap = {}
  leads.forEach(l => {
    const src = l.referral_source || 'Unknown'
    if (!srcMap[src]) srcMap[src] = { total: 0, won: 0 }
    srcMap[src].total++
    if (l.status === 'Won') srcMap[src].won++
  })
  const srcRows = Object.entries(srcMap)
    .filter(([, d]) => d.total >= 2)
    .sort((a, b) => (b[1].won / b[1].total) - (a[1].won / a[1].total))
    .map(([src, d]) => ({ src, ...d, conv: d.total > 0 ? (d.won / d.total) * 100 : 0 }))

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Top 10 Clients by Revenue</h3>
        </div>
        {top10.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No clients yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><TH cols={['#', 'Client', 'Brand', 'Revenue', 'Cases']} /></thead>
              <tbody className="divide-y divide-gray-50">
                {top10.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-xs font-medium text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.doctor_name}</p>
                      {c.clinic_name && <p className="text-xs text-gray-400">{c.clinic_name}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                        {c.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      ${Number(c.total_revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.case_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top Case Types</h3>
            <p className="text-xs text-gray-400 mt-0.5">By lead volume and estimated value</p>
          </div>
          {caseRows.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><TH cols={['Case Type', 'Leads', 'Won', 'Value', 'Conv.']} /></thead>
                <tbody className="divide-y divide-gray-50">
                  {caseRows.map(r => (
                    <tr key={r.type} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-medium text-gray-900">{r.type}</td>
                      <td className="px-5 py-3 text-gray-600">{r.count}</td>
                      <td className="px-5 py-3 font-medium text-green-600">{r.wonCount}</td>
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {r.value > 0 ? `$${r.value.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold text-xs ${r.conv >= 50 ? 'text-green-600' : r.conv > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {r.count > 0 ? `${r.conv.toFixed(0)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Best Sources by Conversion</h3>
            <p className="text-xs text-gray-400 mt-0.5">Minimum 2 leads per source</p>
          </div>
          {srcRows.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">Not enough data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><TH cols={['Source', 'Leads', 'Won', 'Conv. Rate']} /></thead>
                <tbody className="divide-y divide-gray-50">
                  {srcRows.map((r, i) => (
                    <tr key={r.src} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {i === 0 && <span className="mr-1.5">🏆</span>}
                        {r.src}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{r.total}</td>
                      <td className="px-5 py-3 font-medium text-green-600">{r.won}</td>
                      <td className="px-5 py-3">
                        <span className={`font-bold ${r.conv >= 50 ? 'text-green-600' : r.conv > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {r.conv.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Operations ─────────────────────────────────────────────────────────

function OperationsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/reports/operations').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading operations data...</div>
  if (!data) return <div className="text-center py-12 text-gray-400 text-sm">No data available</div>

  const { volume, technicians, case_types, by_stage } = data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', val: volume.total_cases },
          { label: 'Completed', val: volume.completed },
          { label: 'Active', val: volume.active },
          { label: 'Overdue', val: volume.overdue },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="label">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Technician Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/60 border-b border-gray-100">
                {['Technician','Cases','Completed','Value'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {technicians.map(t => (
                  <tr key={t.technician} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.technician}</td>
                    <td className="px-4 py-3 text-gray-600">{t.total}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{t.completed}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">${Number(t.value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Case Types</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/60 border-b border-gray-100">
                {['Type','Total','Completed','Avg Value'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {case_types.map(c => (
                  <tr key={c.case_type} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.case_type}</td>
                    <td className="px-4 py-3 text-gray-600">{c.total}</td>
                    <td className="px-4 py-3 text-green-600">{c.completed}</td>
                    <td className="px-4 py-3 text-gray-700">${Math.round(c.avg_value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Pipeline by Stage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/60 border-b border-gray-100">
              {['Stage','Cases','Value'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {by_stage.map(s => (
                <tr key={s.status} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.status}</td>
                  <td className="px-5 py-3 text-gray-600">{s.count}</td>
                  <td className="px-5 py-3 font-medium text-gray-700">{s.value > 0 ? `$${Number(s.value).toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Import History ─────────────────────────────────────────────────────

function ImportHistoryTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/reports/import-history').then(d => { setRows(d || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const fmt = ts => ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading import history...</div>

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">CSV Import History</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400">No imports yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/60 border-b border-gray-100">
              {['File', 'Added', 'Skipped', 'Imported By', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{r.filename}</td>
                  <td className="px-5 py-3 text-green-600 font-semibold">{r.added}</td>
                  <td className="px-5 py-3 text-gray-400">{r.skipped}</td>
                  <td className="px-5 py-3 text-gray-600">{r.imported_by_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Schedule ───────────────────────────────────────────────────────────

function ScheduleTab() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', frequency: 'weekly', recipients: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchSchedules = () => {
    api.get('/api/report-schedules').then(d => { setSchedules(d || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchSchedules() }, [])

  const handleAdd = async () => {
    const recipients = form.recipients.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    if (!form.name.trim()) return toast('Name is required', 'error')
    if (recipients.length === 0) return toast('Enter at least one valid email', 'error')
    setSaving(true)
    try {
      await api.post('/api/report-schedules', { name: form.name, frequency: form.frequency, recipients })
      toast('Schedule created', 'success')
      setForm({ name: '', frequency: 'weekly', recipients: '' })
      fetchSchedules()
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const toggleSchedule = async (s) => {
    await api.put(`/api/report-schedules/${s.id}`, { ...s, enabled: !s.enabled }).catch(console.error)
    fetchSchedules()
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return
    await api.delete(`/api/report-schedules/${id}`).catch(console.error)
    fetchSchedules()
  }

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">New Scheduled Report</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Schedule Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Weekly Team Report" />
          </div>
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
              <option value="daily">Daily (8:00 AM)</option>
              <option value="weekly">Weekly (Monday 9:00 AM)</option>
              <option value="monthly">Monthly (1st at 8:00 AM)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Recipients <span className="text-gray-400 font-normal">(comma-separated emails)</span></label>
            <input className="input" value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} placeholder="admin@aimdentallab.com, manager@clinic.com" />
          </div>
        </div>
        <button onClick={handleAdd} disabled={saving} className="btn-primary mt-3 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Schedule'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No schedules yet — create one above.</div>
      ) : (
        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{s.frequency} · {s.recipients?.join(', ')}</p>
                <p className="text-xs text-gray-400 mt-0.5">Last sent: {fmtDate(s.last_sent_at)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  role="switch" aria-checked={s.enabled}
                  onClick={() => toggleSchedule(s)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${s.enabled ? 'bg-[#06babe]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${s.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => deleteSchedule(s.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: My Report ───────────────────────────────────────────────────────────

function MyReportTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [sending, setSending] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.get('/api/reports/my-summary')
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleDownloadCSV = () => {
    const a = document.createElement('a')
    a.href = `${import.meta.env.VITE_API_URL || ''}/api/reports/my-summary/csv`
    const token = localStorage.getItem('token')
    // Open in new tab with auth isn't trivially doable; use fetch + blob instead
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/reports/my-summary/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        a.href = url
        const safeName = (data?.rep?.name || 'report').toLowerCase().replace(/\s+/g, '-')
        a.download = `${safeName}-leads-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      .catch(() => toast('CSV download failed', 'error'))
  }

  const handleDownloadPDF = async () => {
    if (!data) return
    setExportingPDF(true)
    try {
      const { downloadRepReportPDF } = await import('../components/ReportPDF')
      await downloadRepReportPDF(data)
      toast('PDF downloaded', 'success')
    } catch (err) {
      toast('PDF export failed: ' + err.message, 'error')
    }
    setExportingPDF(false)
  }

  const handleEmailReport = async () => {
    setSending(true)
    try {
      await api.post('/api/reports/my-summary/email')
      toast(`Report sent to ${data?.rep?.email}`, 'success')
    } catch (err) {
      toast(err.message || 'Failed to send report', 'error')
    }
    setSending(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading your report...</div>
  if (!data) return <div className="text-center py-20 text-gray-400 text-sm">No data available</div>

  const { week, month, allTime, eos, rep } = data
  const totalRocks = (eos?.rocks?.on_track || 0) + (eos?.rocks?.off_track || 0) + (eos?.rocks?.done || 0)

  const StatCard = ({ label, value, sub, color = 'text-gray-900' }) => (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{rep?.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{rep?.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <FileDown size={14} /> Download CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownloadPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
          >
            <FileDown size={14} /> {exportingPDF ? 'Generating...' : 'Download PDF'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleEmailReport}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #06babe, #207290)' }}
          >
            {sending
              ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
              : <><Mail size={14} /> Email to Me</>}
          </motion.button>
        </div>
      </div>

      {/* This week */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">This Week</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Leads Created"  value={week.leads_created} />
          <StatCard label="Contacted"       value={week.contacted} />
          <StatCard label="Proposals"       value={week.proposals} />
          <StatCard label="Wins"            value={week.wins} color="text-green-600" />
        </div>
      </div>

      {/* This month */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          This Month — {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Leads Created" value={month.leads_created} />
          <StatCard label="Wins"          value={month.wins} color="text-green-600" />
          <StatCard label="Revenue"       value={`$${Number(month.revenue).toLocaleString()}`} color="text-[#06babe]" />
          <StatCard
            label="Conversion Rate"
            value={`${month.conversion_rate}%`}
            color={month.conversion_rate >= 50 ? 'text-green-600' : 'text-amber-500'}
          />
        </div>
      </div>

      {/* All-time */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">All-Time</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Leads"  value={allTime.active_leads} />
          <StatCard label="Total Leads"   value={allTime.total_leads} />
          <StatCard label="Total Wins"    value={allTime.total_wins} color="text-green-600" />
          <StatCard label="Total Revenue" value={`$${Number(allTime.total_revenue).toLocaleString()}`} color="text-[#06babe]" />
        </div>
      </div>

      {/* EOS Track */}
      {eos && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">EOS Track</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Rocks */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rocks (90-day)</p>
              {totalRocks === 0 ? (
                <p className="text-sm text-gray-400">No rocks assigned</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">On Track</span>
                    <span className="text-sm font-bold text-green-600">{eos.rocks.on_track}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Off Track</span>
                    <span className={`text-sm font-bold ${eos.rocks.off_track > 0 ? 'text-red-500' : 'text-gray-300'}`}>{eos.rocks.off_track}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Done</span>
                    <span className="text-sm font-bold text-gray-400">{eos.rocks.done}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-700"
                        style={{ width: `${Math.round(eos.rocks.on_track / totalRocks * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Math.round(eos.rocks.on_track / totalRocks * 100)}% on track</p>
                  </div>
                </div>
              )}
            </div>

            {/* To-Dos */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly To-Dos</p>
              <p className="text-3xl font-bold text-gray-900">{eos.todos.done}<span className="text-base font-normal text-gray-400"> / {eos.todos.total}</span></p>
              <p className="text-xs text-gray-400 mt-1">completed this week</p>
              {eos.todos.total > 0 && (
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${eos.todos.done === eos.todos.total ? 'bg-green-500' : 'bg-[#06babe]'}`}
                    style={{ width: `${Math.round(eos.todos.done / eos.todos.total * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Issues */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Open Issues</p>
              <p className={`text-3xl font-bold ${eos.open_issues > 0 ? 'text-amber-500' : 'text-green-600'}`}>{eos.open_issues}</p>
              <p className="text-xs text-gray-400 mt-1">
                {eos.open_issues === 0 ? 'All issues resolved' : `issue${eos.open_issues !== 1 ? 's' : ''} need attention`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent leads */}
      {data.recent_leads?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><TH cols={['Doctor', 'Clinic', 'Status', 'Value', 'Created']} /></thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_leads.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{l.doctor_name}</td>
                    <td className="px-5 py-3 text-gray-500">{l.clinic_name || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        l.status === 'Won' ? 'bg-green-100 text-green-700'
                        : l.status === 'Lost' ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                      }`}>{l.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SendReportModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const toast = useToast()

  const handleSend = async () => {
    if (!email.includes('@')) return toast('Enter a valid email address', 'error')
    setSending(true)
    try {
      await api.post('/api/reports/send', { email })
      toast(`Report sent to ${email}`, 'success')
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to send report', 'error')
    }
    setSending(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-[#06babe] to-[#207290] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Mail size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Send Summary Report</h2>
                  <p className="text-xs text-white/70 mt-0.5">Full CRM snapshot delivered to any inbox</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={18} /></button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              The report includes KPIs, YTD performance, revenue by brand, top 5 clients, cold leads, and overdue cases.
            </p>
            <label className="label">Recipient Email</label>
            <input
              className="input mb-1"
              type="email"
              placeholder="team@aimdentallab.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">You can send to any email — team members, management, or yourself.</p>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending || !email}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Send size={14} /> Send Report</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Reports() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState(isAdmin ? 'overview' : 'my-report')
  const [brand, setBrand] = useState('All')
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [repFilter, setRepFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [dateRange, setDateRange] = useState({ preset: 'all', from: '', to: '' })
  const toast = useToast()

  useEffect(() => {
    if (isAdmin) {
      api.get('/api/users').then(d => setUsers(d || [])).catch(() => {})
    }
  }, [isAdmin])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const repParam = isAdmin && repFilter !== 'all' ? `&rep=${repFilter}` : ''
      const [leadsData, clientsData] = await Promise.all([
        api.get(`/api/leads?archived=false${repParam}`).catch(() => []),
        api.get(`/api/clients${repParam ? `?rep=${repFilter}` : ''}`).catch(() => []),
      ])
      setLeads(leadsData || [])
      setClients(clientsData || [])
      setLoading(false)
    }
    load()
  }, [repFilter])

  const fl = useMemo(() => {
    const { from: drFrom, to: drTo } = dateRangeBounds(dateRange)
    let list = brand === 'All' ? leads : leads.filter(l => l.brand === brand)
    if (drFrom) list = list.filter(l => l.created_at >= drFrom)
    if (drTo)   list = list.filter(l => l.created_at <= drTo)
    return list
  }, [leads, brand, dateRange])
  const fc = brand === 'All' ? clients : clients.filter(c => c.brand === brand)

  const activeRep = repFilter !== 'all' ? users.find(u => u.id === repFilter) : null

  function getDateLabel() {
    if (dateRange.preset === 'all')    return 'All Time'
    if (dateRange.preset === '7d')     return 'Last 7 Days'
    if (dateRange.preset === '30d')    return 'Last 30 Days'
    if (dateRange.preset === '90d')    return 'Last 90 Days'
    if (dateRange.preset === 'ytd')    return `YTD ${new Date().getFullYear()}`
    if (dateRange.preset === 'custom') {
      const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const from = dateRange.from ? fmt(dateRange.from) : '…'
      const to   = dateRange.to   ? fmt(dateRange.to)   : 'Present'
      return `${from} – ${to}`
    }
    return ''
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {activeRep ? `Viewing: ${activeRep.name || activeRep.email}` : 'Analytics and performance insights'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && tab !== 'my-report' && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  setExportingPDF(true)
                  try {
                    const { downloadReportPDF } = await import('../components/ReportPDF')
                    const won    = fl.filter(l => l.status === 'Won')
                    const lost   = fl.filter(l => l.status === 'Lost')
                    const active = fl.filter(l => !['Won', 'Lost'].includes(l.status))
                    const cold14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                    const brandMap = {}
                    won.forEach(l => { brandMap[l.brand] = (brandMap[l.brand] || 0) + Number(l.estimated_value || 0) })
                    await downloadReportPDF({
                      kpis: {
                        active_leads:  active.length,
                        total_clients: fc.length,
                        total_revenue: fc.reduce((s, c) => s + Number(c.total_revenue || 0), 0),
                        lost_leads:    lost.length,
                      },
                      ytd: { ytd_leads: fl.length, ytd_won: won.length, ytd_lost: lost.length },
                      brandRevenue: Object.entries(brandMap).map(([brand, revenue]) => ({ brand, revenue })),
                      topClients: [...fc].sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0)).slice(0, 5),
                      coldCount: active.filter(l => (l.last_contacted_at || l.created_at) < cold14).length,
                      overdueCount: 0,
                    }, getDateLabel())
                    toast('PDF downloaded', 'success')
                  } catch (err) {
                    toast('PDF export failed: ' + err.message, 'error')
                  }
                  setExportingPDF(false)
                }}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
              >
                <FileDown size={14} /> {exportingPDF ? 'Generating...' : 'Export PDF'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #06babe, #207290)' }}
              >
                <Send size={14} /> Send Report
              </motion.button>
            </>
          )}
          {isAdmin && users.length > 0 && tab !== 'my-report' && (
            <select
              className="input text-sm py-1.5 w-auto"
              value={repFilter}
              onChange={e => setRepFilter(e.target.value)}
            >
              <option value="all">All Reps</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          )}
          {tab !== 'my-report' && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
              {['All', 'Aim Dental', 'Kings Highway'].map(b => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    brand === b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {b === 'All' ? 'Both' : b === 'Aim Dental' ? 'Aim' : 'KH'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!['my-report', 'operations', 'imports', 'schedule'].includes(tab) && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Date Range:</span>
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setDateRange(dr => ({ ...dr, preset: p.id }))}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                dateRange.preset === p.id
                  ? 'bg-[#06babe] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[#06babe] hover:text-[#06babe]'
              }`}
            >
              {p.label}
            </button>
          ))}
          {dateRange.preset === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange(dr => ({ ...dr, from: e.target.value }))}
                className="input text-xs py-1 w-36"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange(dr => ({ ...dr, to: e.target.value }))}
                className="input text-xs py-1 w-36"
              />
            </div>
          )}
          {dateRange.preset !== 'all' && (
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{fl.length} lead{fl.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      <div className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar">
        {(isAdmin ? ADMIN_TABS : STAFF_TABS).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-item ${tab === t.id ? 'tab-item-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my-report' ? (
        <MyReportTab />
      ) : loading && !['operations','imports','schedule'].includes(tab) ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="card p-4 space-y-3"><div className="skeleton h-3 w-20 rounded" /><div className="skeleton h-8 w-16 rounded" /></div>)}
          </div>
          <div className="card overflow-hidden"><SkeletonTable rows={6} cols={5} /></div>
        </div>
      ) : (
        <>
          {tab === 'overview'   && <OverviewTab leads={fl} clients={fc} />}
          {tab === 'trends'     && <TrendsTab leads={fl} />}
          {tab === 'sources'    && <SourcesTab leads={fl} />}
          {tab === 'performers' && <PerformersTab leads={fl} clients={fc} />}
          {tab === 'operations' && <OperationsTab />}
          {tab === 'imports'    && <ImportHistoryTab />}
          {tab === 'schedule'   && <ScheduleTab />}
        </>
      )}

      {showSendModal && <SendReportModal onClose={() => setShowSendModal(false)} />}
    </div>
  )
}
