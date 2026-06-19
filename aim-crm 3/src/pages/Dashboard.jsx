import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, UserCheck, DollarSign, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react'

const BRAND_COLORS = {
  'Aim Dental': '#06babe',
  'Kings Highway': '#207290',
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [coldLeads, setColdLeads] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [brandRevenue, setBrandRevenue] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const [kpiRes, coldRes, recentRes, brandRes] = await Promise.all([
      supabase.from('kpi_summary').select('*').single(),
      supabase.from('cold_leads').select('*').order('last_contacted_at', { ascending: true }).limit(5),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('clients').select('brand, total_revenue'),
    ])

    if (kpiRes.data) setKpis(kpiRes.data)
    if (coldRes.data) setColdLeads(coldRes.data)
    if (recentRes.data) setRecentLeads(recentRes.data)
    if (brandRes.data) {
      const grouped = brandRes.data.reduce((acc, c) => {
        acc[c.brand] = (acc[c.brand] || 0) + Number(c.total_revenue)
        return acc
      }, {})
      setBrandRevenue(Object.entries(grouped).map(([brand, revenue]) => ({ brand, revenue })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (n) => `$${Number(n || 0).toLocaleString()}`

  const kpiCards = kpis ? [
    { label: 'Active Leads', value: kpis.active_leads, icon: Users, color: 'text-[#06babe]', bg: 'bg-teal-50' },
    { label: 'Total Clients', value: kpis.total_clients, icon: UserCheck, color: 'text-[#207290]', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: fmt(kpis.total_revenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Lost Leads', value: kpis.lost_leads, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
  ] : []

  const totalRev = brandRevenue.reduce((s, b) => s + b.revenue, 0)

  const statusClass = {
    Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
    Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of both brands</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Brand Split */}
        <div className="card p-5">
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
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: BRAND_COLORS[brand] || '#06babe' }}
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
        </div>

        {/* Cold Leads Alert */}
        <div className="card p-5">
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
              {coldLeads.slice(0, 4).map(lead => {
                const days = lead.last_contacted_at
                  ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000)
                  : '?'
                return (
                  <div key={lead.id} className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">
                      {lead.doctor_name.split(' ').pop()[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{lead.doctor_name}</p>
                      <p className="text-xs text-gray-400">{lead.clinic_name}</p>
                    </div>
                    <span className="text-xs text-amber-600 font-medium flex-shrink-0">{days}d ago</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Leads</h2>
          <div className="space-y-3">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 text-sm">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
