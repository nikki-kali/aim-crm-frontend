import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import AnimatedModal from '../components/AnimatedModal'
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
    <AnimatedModal
      onClose={onClose}
      maxWidth="lg"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{clinic?.id ? 'Edit Clinic' : 'New Clinic'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Clinic'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
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
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Brooklyn, NY" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Website</label>
            <input className="input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://smithdental.com" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg mt-4">{error}</p>}
      </div>
    </AnimatedModal>
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
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Toggle which stage updates this clinic receives via email.</p>
      {STAGES.map(stage => {
        const enabled = prefs[stage] !== false
        return (
          <div key={stage} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{stage}</span>
            <button
              role="switch" aria-checked={enabled}
              disabled={saving === stage}
              onClick={() => toggle(stage)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${enabled ? 'bg-[#06babe]' : 'bg-gray-200 dark:bg-slate-700'}`}
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-slate-400 text-sm">Loading...</div>
    </div>
  )
  if (!clinic) return null

  const totalRevenue = clinic.cases?.reduce((s, c) => s + Number(c.value || 0), 0) || 0

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="2xl"
      header={
        <div>
          <div className="bg-gradient-to-r from-[#06babe] to-[#207290] px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-white text-lg truncate">{clinic.name}</h2>
                <p className="text-white/70 text-sm mt-0.5 truncate">{clinic.brand} · {clinic.address || 'No address'}</p>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white p-1 flex-shrink-0"><X size={18} /></button>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-4 flex-wrap">
              {[
                { label: 'Active Leads', val: clinic.leads?.length || 0 },
                { label: 'Cases', val: clinic.cases?.length || 0 },
                { label: 'Case Value', val: `$${totalRevenue.toLocaleString()}` },
                { label: 'Open Tasks', val: clinic.tasks?.filter(t => !t.completed).length || 0 },
              ].map(k => (
                <div key={k.label} className="text-center">
                  <p className="text-white font-bold text-base sm:text-lg">{k.val}</p>
                  <p className="text-white/60 text-[10px] sm:text-xs">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {[{ id: 'overview', label: 'Overview' }, { id: 'notifications', label: 'Notifications', icon: Bell }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${activeTab === t.id ? 'text-[#06babe] border-b-2 border-[#06babe]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {t.icon && <Bell size={12} />}{t.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="flex gap-4 flex-wrap text-sm">
              {clinic.phone && <a href={`tel:${clinic.phone}`} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#06babe]"><Phone size={14} />{clinic.phone}</a>}
              {clinic.email && <a href={`mailto:${clinic.email}`} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#06babe]"><Mail size={14} />{clinic.email}</a>}
              {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#06babe]"><Globe size={14} />{clinic.website}</a>}
            </div>

            {clinic.cases?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Cases</h3>
                <div className="space-y-1.5">
                  {clinic.cases.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">{c.case_number}</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">{c.case_type}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinic.leads?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Leads</h3>
                <div className="space-y-1.5">
                  {clinic.leads.slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between gap-2 text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{l.doctor_name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${l.status === 'Won' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinic.notes && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Notes</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">{clinic.notes}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'notifications' && <NotificationPrefs clinicId={clinic.id} />}
      </div>
    </AnimatedModal>
  )
}

export default function Clinics() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [filterRep, setFilterRep] = useState('All')
  const [reps, setReps] = useState([])
  const [modal, setModal] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    if (isAdmin) api.get('/api/users/reps').then(data => setReps(data || [])).catch(() => {})
  }, [isAdmin])

  const fetchClinics = async () => {
    setLoading(true)
    const repParam = isAdmin && filterRep !== 'All' ? `?rep=${filterRep}` : ''
    const data = await api.get(`/api/clinics${repParam}`).catch(() => [])
    setClinics(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchClinics() }, [filterRep])

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
    <div className="px-4 py-5 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="page-title">Clinics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{clinics.length} clinic profiles</p>
        </div>
        <button data-tour="clinics-new" onClick={() => setModal('new')} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={16} /> New Clinic
        </button>
      </div>

      <div data-tour="clinics-search" className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search clinics..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
        {isAdmin && (
          <select className="input w-full sm:w-auto" value={filterRep} onChange={e => setFilterRep(e.target.value)}>
            <option value="All">All Reps</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading clinics...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm mb-3">No clinics yet</p>
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
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{clinic.name}</p>
                    <p className="text-xs text-slate-400 truncate">{clinic.lead_source || 'No source'}</p>
                  </div>
                </div>
                <span className={clinic.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                  {clinic.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                </span>
              </div>

              {clinic.address && <p className="text-xs text-slate-400 mb-3 truncate">{clinic.address}</p>}

              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex gap-2 flex-shrink-0">
                  {clinic.phone && <a href={`tel:${clinic.phone}`} className="text-slate-400 hover:text-[#06babe] tap flex items-center justify-center -m-2"><Phone size={14} /></a>}
                  {clinic.email && <a href={`mailto:${clinic.email}`} className="text-slate-400 hover:text-[#06babe] tap flex items-center justify-center -m-2"><Mail size={14} /></a>}
                  {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#06babe] tap flex items-center justify-center -m-2"><Globe size={14} /></a>}
                </div>
                <div className="flex gap-3 items-center flex-shrink-0">
                  <button onClick={() => setDetailId(clinic.id)} className="text-xs text-[#06babe] hover:underline flex items-center gap-0.5">View <ChevronRight size={11} /></button>
                  <button onClick={() => setModal(clinic)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Edit</button>
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
