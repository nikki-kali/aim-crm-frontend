import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Plus, Search, X, AlertTriangle, Calendar } from 'lucide-react'

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const PRIORITY_OPTIONS = ['Normal', 'Rush', 'STAT']
const STATUS_TABS = ['All', 'Pending', 'In Production', 'Delivered']

const PRIORITY_CLASSES = {
  Normal: 'bg-gray-100 text-gray-600',
  Rush: 'bg-amber-50 text-amber-700 border border-amber-200',
  STAT: 'bg-red-50 text-red-700 border border-red-200',
}

const EMPTY_FORM = {
  case_number: '', client_name: '', brand: 'Aim Dental',
  case_type: 'Crown & Bridge', due_date: '', value: '',
  priority: 'Normal', status: 'Pending', notes: '',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const due = new Date(y, m - 1, d, 23, 59, 59)
  return Math.ceil((due - new Date()) / 86400000)
}

function CaseModal({ caseData, onClose, onSave }) {
  const [form, setForm] = useState(caseData || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{caseData?.id ? 'Edit Case' : 'New Case'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
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
              <label className="label">Client Name *</label>
              <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label">Case Type</label>
              <select className="input" value={form.case_type} onChange={e => set('case_type', e.target.value)}>
                {CASE_TYPES.map(c => <option key={c}>{c}</option>)}
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
              <label className="label">Value ($)</label>
              <input className="input" type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Pending', 'In Production', 'Delivered'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any lab notes..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Case'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [activeTab, setActiveTab] = useState('All')
  const [modal, setModal] = useState(null)

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
      (c.case_type || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch &&
      (filterBrand === 'All' || c.brand === filterBrand) &&
      (activeTab === 'All' || c.status === activeTab)
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this case?')) return
    await api.delete(`/api/cases/${id}`).catch(console.error)
    fetchCases()
  }

  const handleStatusChange = async (id, status) => {
    const c = cases.find(c => c.id === id)
    if (!c) return
    await api.put(`/api/cases/${id}`, { ...c, status }).catch(console.error)
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const dueSoonCount = cases.filter(c => {
    const d = daysUntil(c.due_date)
    return d !== null && d >= 0 && d <= 2 && c.status !== 'Delivered'
  }).length

  const tabCounts = {
    All: cases.length,
    Pending: cases.filter(c => c.status === 'Pending').length,
    'In Production': cases.filter(c => c.status === 'In Production').length,
    Delivered: cases.filter(c => c.status === 'Delivered').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cases.length} total cases
            {dueSoonCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle size={12} /> {dueSoonCount} due soon
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Case
        </button>
      </div>

      <div className="overflow-x-auto pb-0.5 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              <span className="ml-1.5 text-xs text-gray-400">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search case #, client, type..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  {['Case #', 'Client', 'Brand', 'Type', 'Due Date', 'Value', 'Priority', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const days = daysUntil(c.due_date)
                  const dueSoon = days !== null && days >= 0 && days <= 2 && c.status !== 'Delivered'
                  const overdue = days !== null && days < 0 && c.status !== 'Delivered'
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50/60 transition-colors ${overdue ? 'bg-red-50/20' : dueSoon ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.case_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.client_name}</td>
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
                            {new Date(c.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {dueSoon && <span className="text-xs text-amber-600 font-medium">{days === 0 ? '· today' : `· ${days}d`}</span>}
                          {overdue && <span className="text-xs text-red-600 font-medium">· overdue</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{c.value ? `$${Number(c.value).toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CLASSES[c.priority]}`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#06babe]/30 cursor-pointer"
                          value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)}>
                          {['Pending', 'In Production', 'Delivered'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setModal(c)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CaseModal
          caseData={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchCases() }}
        />
      )}
    </div>
  )
}
