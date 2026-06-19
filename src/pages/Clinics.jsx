import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Plus, Search, X, Phone, Mail, Globe, Building2, ChevronRight, Bell } from 'lucide-react'

const STAGES = [
  'Case Received', 'Awaiting Scan', 'Case Accepted', 'In Production',
  'Quality Control', 'Ready for Dispatch', 'Dispatched', 'Completed',
]

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const LEAD_SOURCES = ['Referral', 'Google', 'Walk-in', 'Office Visit', 'LinkedIn', 'Other']

const EMPTY_FORM = {
  name: '', brand: 'Aim Dental', address: '', phone: '',
  email: '', website: '', lead_source: '', notes: '',
}

function ClinicModal({ clinic, onClose, onSave }) {
  const [form, setForm] = useState(clinic || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Clinic name is required')
    setSaving(true)
    setError('')
    try {
      if (clinic?.id) {
        await api.put(`/api/clinics/${clinic.id}`, form)
      } else {
        await api.post('/api/clinics', form)
      }
      toast(clinic?.id ? 'Clinic updated' : 'Clinic created', 'success')
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{clinic?.id ? 'Edit Clinic' : 'New Clinic'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Clinic Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Smith Dental Group" />
            </div>
            <div>
              <label className="label">Brand</label>
              <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lead Source</label>
              <select className="input" value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
                <option value="">Select...</option>
                {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(718) 555-0100" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@clinic.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Brooklyn, NY" />
            </div>
            <div className="col-span-2">
              <label className="label">Website</label>
              <input className="input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://smithdental.com" />
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
            {saving ? 'Saving...' : 'Save Clinic'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function NotificationPrefs({ clinicId }) {
  const [prefs, setPrefs] = useState({})
  const [saving, setSaving] = useState(null)
  const toast = useToast()

  useEffect(() => {
    api.get(`/api/clinics/${clinicId}/notification-prefs`).then(rows => {
      const map = {}
      rows.forEach(r => { map[r.stage] = r.enabled })
      setPrefs(map)
    }).catch(() => {})
  }, [clinicId])

  const toggle = async (stage) => {
    const newVal = !(prefs[stage] !== false)
    setPrefs(p => ({ ...p, [stage]: newVal }))
    setSaving(stage)
    try {
      await api.put(`/api/clinics/${clinicId}/notification-prefs`, { stage, enabled: newVal })
      toast(`${stage} notifications ${newVal ? 'enabled' : 'disabled'}`, 'success')
    } catch (err) {
      toast(err.message, 'error')
      setPrefs(p => ({ ...p, [stage]: !newVal }))
    }
    setSaving(null)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">Toggle which stage updates this clinic receives via email.</p>
      {STAGES.map(stage => {
        const enabled = prefs[stage] !== false
        return (
          <div key={stage} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
            <span className="text-xs font-medium text-gray-700">{stage}</span>
            <button
              role="switch" aria-checked={enabled}
              disabled={saving === stage}
              onClick={() => toggle(stage)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${enabled ? 'bg-[#06babe]' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function ClinicDetail({ id, onClose }) {
  const [clinic, setClinic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get(`/api/clinics/${id}`).then(d => { setClinic(d); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-8 text-gray-400 text-sm">Loading...</div>
    </div>
  )
  if (!clinic) return null

  const totalRevenue = clinic.cases?.reduce((s, c) => s + Number(c.value || 0), 0) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-r from-[#06babe] to-[#207290] px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white text-lg">{clinic.name}</h2>
              <p className="text-white/70 text-sm mt-0.5">{clinic.brand} · {clinic.address || 'No address'}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={18} /></button>
          </div>
          <div className="flex gap-4 mt-4">
            {[
              { label: 'Active Leads', val: clinic.leads?.length || 0 },
              { label: 'Cases', val: clinic.cases?.length || 0 },
              { label: 'Case Value', val: `$${totalRevenue.toLocaleString()}` },
              { label: 'Open Tasks', val: clinic.tasks?.filter(t => !t.completed).length || 0 },
            ].map(k => (
              <div key={k.label} className="text-center">
                <p className="text-white font-bold text-lg">{k.val}</p>
                <p className="text-white/60 text-xs">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[{ id: 'overview', label: 'Overview' }, { id: 'notifications', label: 'Notifications', icon: Bell }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${activeTab === t.id ? 'text-[#06babe] border-b-2 border-[#06babe]' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.icon && <Bell size={12} />}{t.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-4">
          {activeTab === 'overview' && (
            <>
              <div className="flex gap-4 flex-wrap text-sm">
                {clinic.phone && <a href={`tel:${clinic.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#06babe]"><Phone size={14} />{clinic.phone}</a>}
                {clinic.email && <a href={`mailto:${clinic.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-[#06babe]"><Mail size={14} />{clinic.email}</a>}
                {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-[#06babe]"><Globe size={14} />{clinic.website}</a>}
              </div>

              {clinic.cases?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Cases</h3>
                  <div className="space-y-1.5">
                    {clinic.cases.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-gray-50 rounded-lg">
                        <span className="font-mono font-semibold text-gray-700">{c.case_number}</span>
                        <span className="text-gray-500">{c.case_type}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${c.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clinic.leads?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Leads</h3>
                  <div className="space-y-1.5">
                    {clinic.leads.slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{l.doctor_name}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${l.status === 'Won' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clinic.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{clinic.notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'notifications' && <NotificationPrefs clinicId={clinic.id} />}
        </div>
      </motion.div>
    </div>
  )
}

export default function Clinics() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [modal, setModal] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const toast = useToast()

  const fetchClinics = async () => {
    setLoading(true)
    const data = await api.get('/api/clinics').catch(() => [])
    setClinics(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchClinics() }, [])

  const filtered = clinics.filter(c =>
    (filterBrand === 'All' || c.brand === filterBrand) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id) => {
    if (!confirm('Delete this clinic?')) return
    await api.delete(`/api/clinics/${id}`).catch(console.error)
    toast('Clinic deleted', 'success')
    fetchClinics()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clinics</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clinics.length} clinic profiles</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Clinic
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search clinics..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading clinics...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-3">No clinics yet</p>
          <button onClick={() => setModal('new')} className="btn-primary">Add your first clinic</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((clinic, i) => (
            <motion.div
              key={clinic.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              whileHover={{ y: -3, boxShadow: '0 10px 24px -6px rgba(6,186,190,0.15)' }}
              className="card p-5 cursor-default"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#06babe]/10 flex items-center justify-center text-[#06babe] font-bold text-sm flex-shrink-0">
                    {clinic.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{clinic.name}</p>
                    <p className="text-xs text-gray-400 truncate">{clinic.lead_source || 'No source'}</p>
                  </div>
                </div>
                <span className={clinic.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                  {clinic.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                </span>
              </div>

              {clinic.address && <p className="text-xs text-gray-400 mb-3 truncate">{clinic.address}</p>}

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  {clinic.phone && <a href={`tel:${clinic.phone}`} className="text-gray-400 hover:text-[#06babe]"><Phone size={14} /></a>}
                  {clinic.email && <a href={`mailto:${clinic.email}`} className="text-gray-400 hover:text-[#06babe]"><Mail size={14} /></a>}
                  {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#06babe]"><Globe size={14} /></a>}
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setDetailId(clinic.id)} className="text-xs text-[#06babe] hover:underline flex items-center gap-0.5">View <ChevronRight size={11} /></button>
                  <button onClick={() => setModal(clinic)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                  <button onClick={() => handleDelete(clinic.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ClinicModal
            clinic={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchClinics() }}
          />
        )}
        {detailId && <ClinicDetail id={detailId} onClose={() => setDetailId(null)} />}
      </AnimatePresence>
    </div>
  )
}
