import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Send, X, Mail } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'trends',     label: 'Trends' },
  { id: 'sources',    label: 'Sources' },
  { id: 'performers', label: 'Top Performers' },
  { id: 'operations', label: 'Operations' },
  { id: 'imports',    label: 'Import History' },
]

function TH({ cols }) {
  return (
    <tr className="bg-gray-50/60 border-b border-gray-100">
      {cols.map(h => (
        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
      ))}
    </tr>
  )
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">YTD Win/Loss Breakdown</h3>
        <div className="space-y-3">
          {bars.map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-12 text-xs text-gray-500 text-right flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(b.count / maxBar) * 100}%`,
                    backgroundColor: b.color,
                    minWidth: b.count > 0 ? 6 : 0,
                  }}
                />
              </div>
              <span className="w-24 text-xs text-gray-600 font-medium flex-shrink-0">
                {b.count} ({total > 0 ? Math.round((b.count / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
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
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([k, d]) => {
      const [y, m] = k.split('-')
      const pct = d.leads > 0 ? (d.won / d.leads) * 100 : 0
      return { label: `${MONTHS[Number(m) - 1].slice(0, 3)} ${y}`, ...d, pct }
    })

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Monthly Trends — Last 12 Months</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-center py-12 text-sm text-gray-400">No data available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><TH cols={['Month', 'Leads', 'Won', 'Lost', 'Est. Revenue', 'Conv. Rate']} /></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.label}</td>
                  <td className="px-5 py-3 text-gray-600">{r.leads}</td>
                  <td className="px-5 py-3 font-medium text-green-600">{r.won}</td>
                  <td className="px-5 py-3 text-red-500">{r.lost}</td>
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {r.revenue > 0 ? `$${r.revenue.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${r.pct >= 50 ? 'text-green-600' : r.pct > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Volume by Source</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.src} className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-500 text-right flex-shrink-0 truncate">{r.src}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(r.total / maxTotal) * 100}%`,
                      backgroundColor: '#06babe',
                      minWidth: r.total > 0 ? 6 : 0,
                    }}
                  />
                </div>
                <span className="w-28 text-xs text-gray-600 font-medium flex-shrink-0">
                  {r.total} leads ({r.pct.toFixed(0)}%)
                </span>
              </div>
            ))}
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
  const [tab, setTab] = useState('overview')
  const [brand, setBrand] = useState('All')
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)

  useEffect(() => {
    async function load() {
      const [leadsData, clientsData] = await Promise.all([
        api.get('/api/leads').catch(() => []),
        api.get('/api/clients').catch(() => []),
      ])
      setLeads(leadsData || [])
      setClients(clientsData || [])
      setLoading(false)
    }
    load()
  }, [])

  const fl = brand === 'All' ? leads : leads.filter(l => l.brand === brand)
  const fc = brand === 'All' ? clients : clients.filter(c => c.brand === brand)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #06babe, #207290)' }}
          >
            <Send size={14} /> Send Report
          </motion.button>
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
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !['operations','imports'].includes(tab) ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading reports...</div>
      ) : (
        <>
          {tab === 'overview'   && <OverviewTab leads={fl} clients={fc} />}
          {tab === 'trends'     && <TrendsTab leads={fl} />}
          {tab === 'sources'    && <SourcesTab leads={fl} />}
          {tab === 'performers' && <PerformersTab leads={fl} clients={fc} />}
          {tab === 'operations' && <OperationsTab />}
          {tab === 'imports'    && <ImportHistoryTab />}
        </>
      )}

      {showSendModal && <SendReportModal onClose={() => setShowSendModal(false)} />}
    </div>
  )
}
