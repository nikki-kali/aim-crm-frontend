import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, UserCheck, ClipboardList, Activity as ActivityIcon,
  Trophy, TrendingUp, Star, Phone, Mail,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { STATUS_CLASSES, INTENT_CLASSES, formatShortDate, scoreColor } from '../lib/leads'
import { STAGE_COLORS } from '../lib/cases'
import { normalizeSource } from '../lib/leadSource'
import { roleLabel } from '../lib/roles'

const TABS = [
  { id: 'leads', label: 'Leads', icon: ClipboardList },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'cases', label: 'Cases', icon: UserCheck },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
]

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatShortDate(ts)
}

export default function RepDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [rep, setRep] = useState(null)
  const [book, setBook] = useState(null)
  const [month, setMonth] = useState(null)
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leads')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [team, leadsData, clientsData, casesData, activityData] = await Promise.all([
        api.get('/api/reports/team-comparison'),
        api.get(`/api/leads?archived=false&view=all&rep=${id}`),
        api.get(`/api/clients?rep=${id}`),
        api.get(`/api/cases?rep=${id}`),
        api.get(`/api/reports/rep/${id}/activities`),
      ])
      const entry = (team || []).find(t => t.rep.id === id)
      if (entry) {
        setRep(entry.rep)
        setBook({ clients_count: entry.clients_count, cases_count: entry.cases_count })
        setMonth(entry.month)
      }
      setLeads(leadsData || [])
      setClients(clientsData || [])
      setCases(casesData || [])
      setActivities(activityData || [])
    } catch (err) {
      toast('Failed to load rep details', 'error')
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  if (!loading && !rep) {
    return (
      <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto">
        <EmptyState icon={Users} title="Rep not found" description="This user may no longer exist or isn't a sales rep." />
      </div>
    )
  }

  const tabCounts = { leads: leads.length, clients: clients.length, cases: cases.length, activity: activities.length }

  return (
    <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-4">
          <ArrowLeft size={15} /> Back to Command Center
        </button>

        {loading ? (
          <div className="card p-5 animate-pulse h-24" />
        ) : (
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {(rep.name || rep.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="page-title">{rep.name || rep.email}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{rep.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#06babe]/10 text-[#06babe]">{roleLabel(rep.role || 'sales_rep')}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6">
              {[
                { label: 'Leads', value: month?.leads_assigned ?? 0, icon: ClipboardList },
                { label: 'Wins', value: month?.leads_won ?? 0, icon: Trophy },
                { label: 'Conv.', value: `${month?.conversion_rate ?? 0}%`, icon: TrendingUp },
                { label: 'Clients', value: book?.clients_count ?? 0, icon: Users },
                { label: 'Cases', value: book?.cases_count ?? 0, icon: UserCheck },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-item whitespace-nowrap flex items-center gap-1.5 ${tab === t.id ? 'tab-item-active' : ''}`}
            >
              <t.icon size={13} /> {t.label} <span className="text-[10px] opacity-60">{tabCounts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card overflow-hidden"><SkeletonTable rows={6} cols={5} /></div>
      ) : (
        <>
          {tab === 'leads' && (
            leads.length === 0 ? (
              <div className="card overflow-hidden"><EmptyState icon={ClipboardList} title="No leads" description="This rep has no leads on record." /></div>
            ) : (
              <div className="card overflow-hidden overflow-x-auto">
                <table className="data-table">
                  <thead><tr>{['Doctor / Clinic', 'Brand', 'Source', 'Status', 'Score', 'Date Added'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id}>
                        <td>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{l.doctor_name}</p>
                          <p className="text-xs text-slate-400">{l.clinic_name || '—'}</p>
                        </td>
                        <td><span className={l.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>{l.brand === 'Aim Dental' ? 'Aim' : 'KH'}</span></td>
                        <td className="text-slate-500 dark:text-slate-400 text-sm">{normalizeSource(l.lead_source || l.referral_source) || '—'}</td>
                        <td><span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_CLASSES[l.status] || ''}`}>{l.status}</span></td>
                        <td>{l.ai_score != null ? <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(l.ai_score)}`}><Star size={10} />{l.ai_score}</span> : '—'}</td>
                        <td className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{formatShortDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'clients' && (
            clients.length === 0 ? (
              <div className="card overflow-hidden"><EmptyState icon={Users} title="No clients" description="This rep has no clients on record." /></div>
            ) : (
              <div className="card overflow-hidden overflow-x-auto">
                <table className="data-table">
                  <thead><tr>{['Doctor / Clinic', 'Brand', 'Revenue', 'Cases', 'Contact'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id}>
                        <td>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{c.doctor_name}</p>
                          <p className="text-xs text-slate-400">{c.clinic_name || '—'}</p>
                        </td>
                        <td><span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>{c.brand === 'Aim Dental' ? 'Aim' : 'KH'}</span></td>
                        <td className="font-semibold text-slate-700 dark:text-slate-300">${Number(c.total_revenue || 0).toLocaleString()}</td>
                        <td className="text-slate-500 dark:text-slate-400">{c.case_count ?? 0}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {c.phone && <a href={`tel:${c.phone}`} className="text-slate-400 hover:text-[#06babe]"><Phone size={13} /></a>}
                            {c.email && <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-[#06babe]"><Mail size={13} /></a>}
                            {!c.phone && !c.email && <span className="text-xs text-slate-300">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'cases' && (
            cases.length === 0 ? (
              <div className="card overflow-hidden"><EmptyState icon={UserCheck} title="No cases" description="This rep's clients have no cases on record." /></div>
            ) : (
              <div className="card overflow-hidden overflow-x-auto">
                <table className="data-table">
                  <thead><tr>{['Case #', 'Client', 'Product', 'Status', 'Value', 'Due'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono text-xs text-slate-500">{c.case_number}</td>
                        <td className="font-semibold text-slate-800 dark:text-slate-200">{c.client_name}</td>
                        <td className="text-slate-500 dark:text-slate-400 text-sm">{c.product || c.case_type || '—'}</td>
                        <td><span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STAGE_COLORS[c.status] || ''}`}>{c.status}</span></td>
                        <td className="font-semibold text-slate-700 dark:text-slate-300">${Number(c.value || 0).toLocaleString()}</td>
                        <td className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{c.due_date ? formatShortDate(c.due_date) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'activity' && (
            activities.length === 0 ? (
              <div className="card overflow-hidden"><EmptyState icon={ActivityIcon} title="No activity yet" description="Nothing has been logged for this rep's leads, clients, or cases." /></div>
            ) : (
              <div className="card p-5">
                <div className="space-y-3">
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#06babe] mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{a.entity_type} · {a.type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(a.created_at)}</span>
                        </div>
                        {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>}
                        {a.created_by_name && <p className="text-[10px] text-slate-400 mt-0.5">by {a.created_by_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
