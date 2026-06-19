import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Plus, Search, X, AlertTriangle, Calendar, Mail, RefreshCw } from 'lucide-react'

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const PRIORITY_OPTIONS = ['Normal', 'Rush', 'STAT']

const STAGES = [
  'Case Received', 'Awaiting Scan', 'Case Accepted',
  'In Production', 'Quality Control', 'Ready for Dispatch',
  'Dispatched', 'Completed',
]

const STAGE_COLORS = {
  'Case Received':    'bg-gray-100 text-gray-600',
  'Awaiting Scan':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Case Accepted':    'bg-blue-50 text-blue-700 border border-blue-200',
  'In Production':    'bg-purple-50 text-purple-700 border border-purple-200',
  'Quality Control':  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Ready for Dispatch':'bg-teal-50 text-teal-700 border border-teal-200',
  'Dispatched':       'bg-orange-50 text-orange-700 border border-orange-200',
  'Completed':        'bg-green-50 text-green-700 border border-green-200',
}

const PRIORITY_CLASSES = {
  Normal: 'bg-gray-100 text-gray-600',
  Rush:   'bg-amber-50 text-amber-700 border border-amber-200',
  STAT:   'bg-red-50 text-red-700 border border-red-200',
}

const EMPTY_FORM = {
  case_number: '', client_name: '', brand: 'Aim Dental',
  case_type: 'Crown & Bridge', patient: '', assigned_technician: '',
  tracking_number: '', due_date: '', est_completion_date: '', value: '',
  priority: 'Normal', status: 'Case Received', notes: '',
  doctor_email: '', doctor_phone: '',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(y, m - 1, d, 23, 59, 59) - new Date()) / 86400000)
}

function CaseModal({ caseData, onClose, onSave }) {
  const [form, setForm] = useState(caseData || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.client_name.trim()) return setError('Client name is required')
    if (!form.due_date) return setError('Due date is required')
    setSaving(true)
    setError('')
    try {
      const data = { ...form, value: Number(form.value) || 0 }
      if (caseData?.id) {
        await api.put(`/api/cases/${caseData.id}`, data)
      } else {
        await api.post('/api/cases', data)
      }
      toast(caseData?.id ? 'Case updated' : 'Case created', 'success')
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleResend = async () => {
    if (!caseData?.id) return
    try {
      await api.post(`/api/cases/${caseData.id}/resend-notification`)
      toast('Notification resent', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{caseData?.id ? 'Edit Case' : 'New Case'}</h2>
          <div className="flex items-center gap-2">
            {caseData?.id && caseData?.doctor_email && (
              <button onClick={handleResend} className="text-xs flex items-center gap-1 text-[#06babe] hover:underline">
                <Mail size={12} /> Resend notification
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Case # <span className="text-gray-400 font-normal">(auto if blank)</span></label>
              <input className="input font-mono" value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="AIM-2026-001" />
            </div>
            <div>
              <label className="label">Brand</label>
              <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Client / Doctor Name *</label>
              <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label">Patient Name</label>
              <input className="input" value={form.patient} onChange={e => set('patient', e.target.value)} placeholder="John D." />
            </div>
            <div>
              <label className="label">Case Type</label>
              <select className="input" value={form.case_type} onChange={e => set('case_type', e.target.value)}>
                {CASE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stage / Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Est. Completion Date</label>
              <input className="input" type="date" value={form.est_completion_date} onChange={e => set('est_completion_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Assigned Technician</label>
              <input className="input" value={form.assigned_technician} onChange={e => set('assigned_technician', e.target.value)} placeholder="Tech name" />
            </div>
            <div>
              <label className="label">Tracking Number</label>
              <input className="input" value={form.tracking_number} onChange={e => set('tracking_number', e.target.value)} placeholder="1Z999..." />
            </div>
            <div>
              <label className="label">Value ($)</label>
              <input className="input" type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Doctor Email <span className="text-gray-400 font-normal">(for notifications)</span></label>
              <input className="input" type="email" value={form.doctor_email} onChange={e => set('doctor_email', e.target.value)} placeholder="dr@clinic.com" />
            </div>
            <div>
              <label className="label">Doctor Phone</label>
              <input className="input" value={form.doctor_phone} onChange={e => set('doctor_phone', e.target.value)} placeholder="(718) 555-0100" />
            </div>
            <div className="col-span-2">
              <label className="label">Internal Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Production instructions..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Case'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Cases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [activeStage, setActiveStage] = useState('All')
  const [modal, setModal] = useState(null)
  const toast = useToast()

  const fetchCases = async () => {
    setLoading(true)
    const data = await api.get('/api/cases').catch(() => [])
    setCases(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCases() }, [])

  const filtered = cases.filter(c => {
    const matchSearch = !search ||
      (c.case_number || '').toLowerCase().includes(search.toLowerCase()) ||
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.patient || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.case_type || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch &&
      (filterBrand === 'All' || c.brand === filterBrand) &&
      (activeStage === 'All' || c.status === activeStage)
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this case?')) return
    await api.delete(`/api/cases/${id}`).catch(console.error)
    toast('Case deleted', 'success')
    fetchCases()
  }

  const handleStageChange = async (id, status) => {
    const c = cases.find(c => c.id === id)
    if (!c) return
    await api.put(`/api/cases/${id}`, { ...c, status }).catch(console.error)
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const stageCounts = { All: cases.length }
  STAGES.forEach(s => { stageCounts[s] = cases.filter(c => c.status === s).length })

  const dueSoonCount = cases.filter(c => {
    const d = daysUntil(c.due_date)
    return d !== null && d >= 0 && d <= 2 && c.status !== 'Completed'
  }).length

  const overdueCount = cases.filter(c => {
    const d = daysUntil(c.due_date)
    return d !== null && d < 0 && c.status !== 'Completed'
  }).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
            {cases.length} total
            {dueSoonCount > 0 && <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><AlertTriangle size={12} /> {dueSoonCount} due soon</span>}
            {overdueCount > 0 && <span className="inline-flex items-center gap-1 text-red-600 font-medium"><AlertTriangle size={12} /> {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCases} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} /></button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Case</button>
        </div>
      </div>

      {/* Stage filter tabs — scrollable */}
      <div className="overflow-x-auto pb-1 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max">
          {['All', ...STAGES].map(stage => (
            <button key={stage} onClick={() => setActiveStage(stage)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeStage === stage ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {stage}
              <span className="ml-1 text-gray-400">{stageCounts[stage] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search case #, client, patient, type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading cases...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-3">No cases found</p>
            <button onClick={() => setModal('new')} className="btn-primary">Add your first case</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Case #', 'Client', 'Patient', 'Brand', 'Type', 'Due Date', 'Value', 'Priority', 'Stage', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, i) => {
                  const days = daysUntil(c.due_date)
                  const dueSoon = days !== null && days >= 0 && days <= 2 && c.status !== 'Completed'
                  const overdue = days !== null && days < 0 && c.status !== 'Completed'
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`hover:bg-gray-50/60 transition-colors ${overdue ? 'bg-red-50/20' : dueSoon ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.case_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.client_name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.patient || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                          {c.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.case_type}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className={overdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-gray-400'} />
                          <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-medium' : 'text-gray-700'}>
                            {c.due_date ? new Date(c.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </span>
                          {dueSoon && <span className="text-xs text-amber-600 font-medium">{days === 0 ? '· today' : `· ${days}d`}</span>}
                          {overdue && <span className="text-xs text-red-600 font-medium">· overdue</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{c.value ? `$${Number(c.value).toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CLASSES[c.priority] || ''}`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#06babe]/30 cursor-pointer"
                          value={c.status}
                          onChange={e => handleStageChange(c.id, e.target.value)}
                        >
                          {STAGES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setModal(c)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <CaseModal
            caseData={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchCases() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
