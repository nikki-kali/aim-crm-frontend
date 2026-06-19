import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Phone, Mail, X } from 'lucide-react'

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const REFERRAL_SOURCES = ['Referral', 'Google', 'Instagram', 'Walk-in', 'Other']

const EMPTY_FORM = {
  doctor_name: '', clinic_name: '', brand: 'Aim Dental', phone: '',
  email: '', address: '', referral_source: '', total_revenue: '', case_count: '', notes: ''
}

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.doctor_name.trim()) return setError('Doctor name is required')
    setSaving(true)
    setError('')
    const data = {
      ...form,
      total_revenue: Number(form.total_revenue) || 0,
      case_count: Number(form.case_count) || 0,
      updated_at: new Date().toISOString(),
    }
    const res = client?.id
      ? await supabase.from('clients').update(data).eq('id', client.id)
      : await supabase.from('clients').insert(data)
    setSaving(false)
    if (res.error) return setError(res.error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{client?.id ? 'Edit Client' : 'New Client'}</h2>
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
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(718) 555-0100" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="dr@clinic.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Brooklyn, NY" />
            </div>
            <div>
              <label className="label">Referral Source</label>
              <select className="input" value={form.referral_source} onChange={e => set('referral_source', e.target.value)}>
                <option value="">Select...</option>
                {REFERRAL_SOURCES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Total Revenue ($)</label>
              <input className="input" type="number" value={form.total_revenue} onChange={e => set('total_revenue', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Case Count</label>
              <input className="input" type="number" value={form.case_count} onChange={e => set('case_count', e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [modal, setModal] = useState(null)

  const fetchClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('total_revenue', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.clinic_name || '').toLowerCase().includes(search.toLowerCase())
    const matchBrand = filterBrand === 'All' || c.brand === filterBrand
    return matchSearch && matchBrand
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  const totalRevenue = filtered.reduce((s, c) => s + Number(c.total_revenue || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} total clients · ${totalRevenue.toLocaleString()} revenue</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search doctor or clinic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-3">No clients found</p>
          <button onClick={() => setModal('new')} className="btn-primary">Add your first client</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#06babe]/10 flex items-center justify-center text-[#06babe] font-bold text-sm flex-shrink-0">
                    {client.doctor_name.split(' ').filter(Boolean).slice(-1)[0]?.[0] || 'D'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{client.doctor_name}</p>
                    <p className="text-xs text-gray-400 truncate">{client.clinic_name}</p>
                  </div>
                </div>
                <span className={client.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                  {client.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-sm font-semibold text-gray-800">${Number(client.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Cases</p>
                  <p className="text-sm font-semibold text-gray-800">{client.case_count || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {client.phone && <a href={`tel:${client.phone}`} className="text-gray-400 hover:text-[#06babe]"><Phone size={15} /></a>}
                  {client.email && <a href={`mailto:${client.email}`} className="text-gray-400 hover:text-[#06babe]"><Mail size={15} /></a>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(client)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                  <button onClick={() => handleDelete(client.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>

              {client.notes && (
                <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3 truncate">{client.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchClients() }}
        />
      )}
    </div>
  )
}
