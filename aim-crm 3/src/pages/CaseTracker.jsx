import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, AlertTriangle, Clock, CheckCircle, Package } from 'lucide-react'

const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const PRIORITY_OPTIONS = ['Normal', 'Rush', 'STAT']
const STATUS_OPTIONS = ['Pending', 'In Production', 'Delivered']

const PRIORITY_CLASSES = {
  Normal: 'bg-gray-100 text-gray-600',
  Rush: 'bg-amber-50 text-amber-700 border border-amber-200',
  STAT: 'bg-red-50 text-red-700 border border-red-200',
}

const EMPTY_FORM = {
  case_number: '', client_name: '', brand: 'Aim Dental', case_type: 'Crown & Bridge',
  status: 'Pending', priority: 'Normal', due_date: '', value: '', units: 1, shade: '', notes: ''
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function DueBadge({ dueDate, status }) {
  if (status === 'Delivered') return null
  const days = daysUntil(dueDate)
  if (days === null) return null
  if (days < 0) return <span className="text-xs text-red-600 font-medium">⚠ Overdue</span>
  if (days === 0) return <span className="text-xs text-red-600 font-medium">⚠ Due today</span>
  if (days <= 2) return <span className="text-xs text-amber-600 font-medium">⏰ Due in {days}d</span>
  return <span className="text-xs text-gray-400">{days}d left</span>
}

function CaseModal({ caseItem, onClose, onSave }) {
  const [form, setForm] = useState(caseItem || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.client_name.trim()) return setError('Client name is required')
    if (!form.case_type) return setError('Case type is required')
    setSaving(true)
    setError('')
    const data = {
      ...form,
      value: Number(form.value) || 0,
      units: Number(form.units) || 1,
      due_date: form.due_date || null,
      updated_at: new Date().toISOString(),
    }
    const res = caseItem?.id
      ? await supabase.from('cases').update(data).eq('id', caseItem.id)
      : await supabase.from('cases').insert(data)
    setSaving(false)
    if (res.error) return setError(res.error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{caseItem?.id ? 'Edit Case' : 'New Case'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Client / Doctor Name *</label>
              <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label">Brand</label>
              <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Case Type *</label>
              <select className="input" value={form.case_type} onChange={e => set('case_type', e.target.value)}>
                {CASE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Value ($)</label>
              <input className="input" type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Units</label>
              <input className="input" type="number" value={form.units} onChange={e => set('units', e.target.value)} min="1" />
            </div>
            <div>
              <label className="label">Shade</label>
              <input className="input" value={form.shade} onChange={e => set('shade', e.target.value)} placeholder="A2, B1..." />
            </div>
            <div className="col-span-2">
              <label className="label">Instructions / Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special instructions..." />
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

function CaseCard({ c, onEdit, onDelete, onStatusChange }) {
  return (
    <div className={`card p-4 hover:shadow-md transition-shadow ${c.priority === 'STAT' ? 'border-red-200' : c.priority === 'Rush' ? 'border-amber-200' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-mono">{c.case_number}</p>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{c.client_name}</p>
          <p className="text-xs text-gray-500">{c.case_type} · {c.units} unit{c.units !== 1 ? 's' : ''}{c.shade ? ` · ${c.shade}` : ''}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CLASSES[c.priority]}`}>
          {c.priority}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
          {c.brand === 'Aim Dental' ? 'Aim' : 'KH'}
        </span>
        <div className="flex items-center gap-2">
          {c.value > 0 && <span className="text-sm font-semibold text-gray-700">${Number(c.value).toLocaleString()}</span>}
          <DueBadge dueDate={c.due_date} status={c.status} />
        </div>
      </div>

      {c.notes && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{c.notes}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <select
          value={c.status}
          onChange={e => onStatusChange(c.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#06babe]/30 text-gray-600"
        >
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => onEdit(c)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
          <button onClick={() => onDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function CaseTracker() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [filterBrand, setFilterBrand] = useState('All')
  const [modal, setModal] = useState(null)

  const fetchCases = async () => {
    setLoading(true)
    const { data } = await supabase.from('cases').select('*').order('due_date', { ascending: true, nullsFirst: false })
    setCases(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCases() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this case?')) return
    await supabase.from('cases').delete().eq('id', id)
    fetchCases()
  }

  const handleStatusChange = async (id, status) => {
    await supabase.from('cases').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchCases()
  }

  const tabs = ['All', 'Pending', 'In Production', 'Delivered']
  const tabIcons = { All: Package, Pending: Clock, 'In Production': AlertTriangle, Delivered: CheckCircle }

  const filtered = cases.filter(c => {
    const matchTab = activeTab === 'All' || c.status === activeTab
    const matchBrand = filterBrand === 'All' || c.brand === filterBrand
    return matchTab && matchBrand
  })

  const counts = {
    All: cases.length,
    Pending: cases.filter(c => c.status === 'Pending').length,
    'In Production': cases.filter(c => c.status === 'In Production').length,
    Delivered: cases.filter(c => c.status === 'Delivered').length,
  }

  const dueSoon = cases.filter(c => {
    const d = daysUntil(c.due_date)
    return c.status !== 'Delivered' && d !== null && d <= 2
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Case Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cases.length} total cases</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="All">All Brands</option>
            {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Case
          </button>
        </div>
      </div>

      {/* Due Soon Alert */}
      {dueSoon.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{dueSoon.length} case{dueSoon.length > 1 ? 's' : ''}</span> due within 2 days: {dueSoon.map(c => c.case_number).join(', ')}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tabIcons[tab]
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-[#06babe]/10 text-[#06babe]' : 'bg-gray-200 text-gray-500'}`}>
                {counts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading cases...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-3">No cases found</p>
          <button onClick={() => setModal('new')} className="btn-primary">Add first case</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <CaseCard
              key={c.id}
              c={c}
              onEdit={setModal}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {modal && (
        <CaseModal
          caseItem={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchCases() }}
        />
      )}
    </div>
  )
}
