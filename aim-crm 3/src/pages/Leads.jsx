import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, X, ChevronDown, Phone, Mail, Star } from 'lucide-react'

const STATUS_OPTIONS = ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost', 'Pending']
const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const REFERRAL_SOURCES = ['Referral', 'Google', 'Instagram', 'Walk-in', 'Other']

const STATUS_CLASSES = {
  Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
  Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending'
}

const EMPTY_FORM = {
  doctor_name: '', clinic_name: '', brand: 'Aim Dental', case_interest: '', phone: '',
  email: '', referral_source: '', estimated_value: '', status: 'Lead', notes: ''
}

function scoreFromLead(lead) {
  let score = 50
  if (lead.estimated_value >= 5000) score += 20
  else if (lead.estimated_value >= 2000) score += 10
  if (lead.referral_source === 'Referral') score += 15
  if (['Implant', 'Crown & Bridge'].includes(lead.case_interest)) score += 10
  if (lead.email) score += 5
  return Math.min(score, 100)
}

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.doctor_name.trim()) return setError('Doctor name is required')
    setSaving(true)
    setError('')
    const data = {
      ...form,
      estimated_value: Number(form.estimated_value) || 0,
      ai_score: scoreFromLead({ ...form, estimated_value: Number(form.estimated_value) || 0 }),
      last_contacted_at: form.last_contacted_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const res = lead?.id
      ? await supabase.from('leads').update(data).eq('id', lead.id)
      : await supabase.from('leads').insert(data)
    setSaving(false)
    if (res.error) return setError(res.error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{lead?.id ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Doctor Name *</label>
              <input className="input" value={form.doctor_name} onChange={e => set('doctor_name', e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label">Clinic Name</label>
              <input className="input" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} placeholder="Smith Dental" />
            </div>
            <div>
              <label className="label">Brand</label>
              <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Case Interest</label>
              <select className="input" value={form.case_interest} onChange={e => set('case_interest', e.target.value)}>
                <option value="">Select...</option>
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
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(718) 555-0100" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="dr@clinic.com" />
            </div>
            <div>
              <label className="label">Referral Source</label>
              <select className="input" value={form.referral_source} onChange={e => set('referral_source', e.target.value)}>
                <option value="">Select...</option>
                {REFERRAL_SOURCES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estimated Value ($)</label>
              <input className="input" type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant notes..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [modal, setModal] = useState(null) // null | 'new' | lead object

  const fetchLeads = async () => {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.clinic_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.case_interest || '').toLowerCase().includes(search.toLowerCase())
    const matchBrand = filterBrand === 'All' || l.brand === filterBrand
    const matchStatus = filterStatus === 'All' || l.status === filterStatus
    return matchSearch && matchBrand && matchStatus
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    fetchLeads()
  }

  const handleContactNow = async (lead) => {
    await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead.id)
    fetchLeads()
  }

  const scoreColor = (s) => {
    if (s >= 80) return 'text-green-600 bg-green-50'
    if (s >= 60) return 'text-amber-600 bg-amber-50'
    return 'text-red-500 bg-red-50'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} total leads</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search doctor, clinic, case type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-3">No leads found</p>
            <button onClick={() => setModal('new')} className="btn-primary">Add your first lead</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Doctor / Clinic</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Case</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(lead => {
                  const daysSince = lead.last_contacted_at
                    ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000)
                    : null
                  const isCold = daysSince !== null && daysSince >= 14 && !['Won', 'Lost'].includes(lead.status)

                  return (
                    <tr key={lead.id} className={`hover:bg-gray-50/60 transition-colors ${isCold ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{lead.doctor_name}</p>
                          <p className="text-xs text-gray-400">{lead.clinic_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={lead.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                          {lead.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.case_interest || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.ai_score != null ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(lead.ai_score)}`}>
                            <Star size={10} />
                            {lead.ai_score}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[lead.status] || ''}`}>
                          {lead.status}
                        </span>
                        {isCold && <span className="ml-1 text-xs text-amber-600">⚠ {daysSince}d</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {lead.phone && <a href={`tel:${lead.phone}`} className="text-gray-400 hover:text-[#06babe]"><Phone size={14} /></a>}
                          {lead.email && <a href={`mailto:${lead.email}`} className="text-gray-400 hover:text-[#06babe]"><Mail size={14} /></a>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleContactNow(lead)}
                            className="text-xs text-[#06babe] hover:underline"
                            title="Mark as contacted now"
                          >
                            Contacted
                          </button>
                          <button onClick={() => setModal(lead)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                          <button onClick={() => handleDelete(lead.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
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
        <LeadModal
          lead={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchLeads() }}
        />
      )}
    </div>
  )
}
