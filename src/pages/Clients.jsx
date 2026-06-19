import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Plus, Search, Phone, Mail, X, ChevronRight, ClipboardList, Activity, CheckSquare, Square } from 'lucide-react'

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const REFERRAL_SOURCES = ['Referral', 'Google', 'Instagram', 'Walk-in', 'Other']
const ACTIVITY_TYPES = ['Call', 'Email', 'Visit', 'Note', 'Follow-up', 'Meeting']

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
    try {
      const data = { ...form, total_revenue: Number(form.total_revenue) || 0, case_count: Number(form.case_count) || 0 }
      if (client?.id) {
        await api.put(`/api/clients/${client.id}`, data)
      } else {
        await api.post('/api/clients', data)
      }
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
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
      </motion.div>
    </div>
  )
}

function ClientDrawer({ clientId, onClose, onEdit }) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('activity')
  const [newActivity, setNewActivity] = useState({ type: 'Call', description: '' })
  const [newTask, setNewTask] = useState({ title: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchClient = async () => {
    const data = await api.get(`/api/clients/${clientId}`).catch(() => null)
    setClient(data)
    setLoading(false)
  }

  useEffect(() => { fetchClient() }, [clientId])

  const logActivity = async () => {
    if (!newActivity.description.trim()) return
    setSaving(true)
    try {
      await api.post('/api/activities', {
        entity_type: 'client', entity_id: clientId,
        type: newActivity.type, description: newActivity.description,
      })
      setNewActivity({ type: 'Call', description: '' })
      toast('Activity logged', 'success')
      fetchClient()
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return
    setSaving(true)
    try {
      await api.post('/api/tasks', {
        entity_type: 'client', entity_id: clientId,
        title: newTask.title, due_date: newTask.due_date || null,
      })
      setNewTask({ title: '', due_date: '' })
      toast('Task added', 'success')
      fetchClient()
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const toggleTask = async (task) => {
    await api.put(`/api/tasks/${task.id}`, { ...task, completed: !task.completed }).catch(console.error)
    fetchClient()
  }

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const timeAgo = ts => {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
        ) : !client ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Client not found</div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#06babe] to-[#207290] px-5 py-5 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-bold text-white text-base leading-tight">{client.doctor_name}</h2>
                  <p className="text-white/70 text-xs mt-0.5">{client.clinic_name || 'Independent'} · {client.brand}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(client)} className="text-white/70 hover:text-white text-xs bg-white/10 px-3 py-1.5 rounded-lg">Edit</button>
                  <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={16} /></button>
                </div>
              </div>
              <div className="flex gap-4">
                {[
                  { label: 'Revenue', val: `$${Number(client.total_revenue || 0).toLocaleString()}` },
                  { label: 'Cases', val: client.case_count || 0 },
                  { label: 'Activities', val: client.activities?.length || 0 },
                  { label: 'Tasks', val: client.tasks?.filter(t => !t.completed).length || 0 },
                ].map(k => (
                  <div key={k.label} className="text-center">
                    <p className="text-white font-bold text-sm">{k.val}</p>
                    <p className="text-white/60 text-xs">{k.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-3">
                {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-white/70 hover:text-white text-xs"><Phone size={11} />{client.phone}</a>}
                {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-white/70 hover:text-white text-xs"><Mail size={11} />{client.email}</a>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { id: 'activity', label: 'Activity', icon: Activity },
                { id: 'tasks',   label: 'Tasks',    icon: CheckSquare },
                { id: 'cases',   label: 'Cases',    icon: ClipboardList },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                    activeTab === id ? 'text-[#06babe] border-b-2 border-[#06babe]' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon size={13} />{label}
                  {id === 'tasks' && client.tasks?.filter(t => !t.completed).length > 0 && (
                    <span className="bg-[#06babe] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{client.tasks.filter(t => !t.completed).length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Activity tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <select className="input text-xs py-1.5 w-28 flex-shrink-0" value={newActivity.type} onChange={e => setNewActivity(p => ({ ...p, type: e.target.value }))}>
                        {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input className="input text-xs py-1.5 flex-1" value={newActivity.description} onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))} placeholder="What happened?" onKeyDown={e => e.key === 'Enter' && logActivity()} />
                    </div>
                    <button onClick={logActivity} disabled={saving || !newActivity.description.trim()} className="btn-primary text-xs w-full py-1.5 disabled:opacity-50">Log Activity</button>
                  </div>
                  {client.activities?.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No activities yet</p>}
                  <div className="space-y-2">
                    {client.activities?.map(a => (
                      <div key={a.id} className="flex gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#06babe] mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">{a.type}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{a.description}</p>
                          {a.created_by_name && <p className="text-[10px] text-gray-400 mt-0.5">by {a.created_by_name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <input className="input text-xs py-1.5" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title..." onKeyDown={e => e.key === 'Enter' && addTask()} />
                    <div className="flex gap-2">
                      <input className="input text-xs py-1.5 flex-1" type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} />
                      <button onClick={addTask} disabled={saving || !newTask.title.trim()} className="btn-primary text-xs px-4 disabled:opacity-50">Add</button>
                    </div>
                  </div>
                  {client.tasks?.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No tasks yet</p>}
                  <div className="space-y-1.5">
                    {client.tasks?.map(t => (
                      <div key={t.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${t.completed ? 'bg-gray-50' : 'bg-white border border-gray-100'}`}>
                        <button onClick={() => toggleTask(t)} className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-[#06babe]">
                          {t.completed ? <CheckSquare size={15} className="text-green-500" /> : <Square size={15} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${t.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</p>
                          {t.due_date && <p className="text-[10px] text-gray-400 mt-0.5">Due {fmtDate(t.due_date)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cases tab */}
              {activeTab === 'cases' && (
                <div className="space-y-1.5">
                  {client.cases?.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No cases linked</p>}
                  {client.cases?.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <span className="font-mono font-semibold text-gray-700">{c.case_number}</span>
                        <span className="ml-2 text-gray-500">{c.case_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.value > 0 && <span className="text-[#06babe] font-semibold">${Number(c.value).toLocaleString()}</span>}
                        <span className={`px-2 py-0.5 rounded-full font-medium ${c.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [modal, setModal] = useState(null)
  const [drawerClientId, setDrawerClientId] = useState(null)
  const toast = useToast()

  const fetchClients = async () => {
    setLoading(true)
    const data = await api.get('/api/clients').catch(() => [])
    setClients(data)
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.clinic_name || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filterBrand === 'All' || c.brand === filterBrand)
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    await api.delete(`/api/clients/${id}`).catch(console.error)
    toast('Client deleted', 'success')
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

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search doctor or clinic..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="All">All Brands</option>
          {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-3">No clients found</p>
          <button onClick={() => setModal('new')} className="btn-primary">Add your first client</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 12px 28px -6px rgba(6,186,190,0.15)' }}
              className="card p-5 cursor-default"
            >
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
                <div className="flex gap-2 items-center">
                  <button onClick={() => setDrawerClientId(client.id)} className="text-xs text-[#06babe] hover:underline flex items-center gap-0.5">
                    View <ChevronRight size={11} />
                  </button>
                  <button onClick={() => setModal(client)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                  <button onClick={() => handleDelete(client.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>

              {client.notes && (
                <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3 truncate">{client.notes}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ClientModal
            client={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchClients() }}
          />
        )}
        {drawerClientId && (
          <ClientDrawer
            clientId={drawerClientId}
            onClose={() => setDrawerClientId(null)}
            onEdit={(c) => { setDrawerClientId(null); setModal(c) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
