import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Plus, Search, X, AlertTriangle, Calendar, Mail, RefreshCw, Truck, Package } from 'lucide-react'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const PRIORITY_OPTIONS = ['Normal', 'Rush', 'STAT']

// Removable cases (Dentures/Partial) are the only ones that go through the
// plaster department + outsourcing-lab shipment leg of AIM's workflow.
const REMOVABLE_TYPES = ['Dentures', 'Partial']

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
  // Production detail (any case)
  product: '', tooth_numbers: '', quantity: 1, shade: '',
  special_instructions: '', evident_case_number: '',
  sterilized_by: '', sterilized_at: '', entered_by: '', entered_at: '',
  // Removable-only (Dentures/Partial): plaster dept -> delivery -> packing -> outsourcing
  plaster_checked_by: '', plaster_checked_at: '',
  delivered_by: '', delivered_at: '',
  packed_by: '', packed_at: '',
  outsourcing_return_date: '', outsourcing_tracking_number: '', shipped_to_outsourcing_at: '',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(y, m - 1, d, 23, 59, 59) - new Date()) / 86400000)
}

// timestamptz columns (sterilized_at, entered_at, etc.) round-trip as full
// ISO strings — trim to YYYY-MM-DD for <input type="date">. No-op on
// columns that are already plain dates.
function toDateInput(v) {
  return v ? String(v).slice(0, 10) : ''
}

const DATE_FIELDS = [
  'due_date', 'est_completion_date', 'sterilized_at', 'entered_at',
  'plaster_checked_at', 'delivered_at', 'packed_at', 'outsourcing_return_date',
]

// The handful of people who actually do this work — see PRODUCTION_STEPS
// below and the "Assigned Technician" field. "Other" reveals free text so
// anyone not on the list can still be recorded.
const STAFF_OPTIONS = ['Frankie', 'Cecile', 'Anjali', 'Miguel', 'Victor']

function StaffPicker({ value, onChange, placeholder }) {
  const [showOther, setShowOther] = useState(() => !!value && !STAFF_OPTIONS.includes(value))
  return (
    <div className="space-y-1.5">
      <select
        className="input"
        value={showOther ? 'Other' : (value || '')}
        onChange={e => {
          if (e.target.value === 'Other') { setShowOther(true); onChange('') }
          else { setShowOther(false); onChange(e.target.value) }
        }}
      >
        <option value="">— Select —</option>
        {STAFF_OPTIONS.map(s => <option key={s}>{s}</option>)}
        <option value="Other">Other…</option>
      </select>
      {showOther && (
        <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Name'} autoFocus />
      )}
    </div>
  )
}

// The internal production checkpoints from AIM's real workflow. The last
// three only apply to Removable cases (Dentures/Partial) — see
// stepsForCase(). Kept fully separate from the doctor-facing STAGES above:
// marking these never changes `status` and never sends a doctor email.
const PRODUCTION_STEPS = [
  { key: 'sterilized',      label: 'Sterilized',              byField: 'sterilized_by',      atField: 'sterilized_at',      badge: 'S' },
  { key: 'entered',         label: 'Entered Into Evident',    byField: 'entered_by',          atField: 'entered_at',         badge: 'E' },
  { key: 'plaster_checked', label: 'Plaster Checked',         byField: 'plaster_checked_by',  atField: 'plaster_checked_at', badge: 'P', removableOnly: true },
  { key: 'delivered',       label: 'Delivered to Shipping',   byField: 'delivered_by',        atField: 'delivered_at',       badge: 'D', removableOnly: true },
  { key: 'packed',          label: 'Packed',                  byField: 'packed_by',           atField: 'packed_at',          badge: 'K', removableOnly: true },
]

function stepsForCase(c) {
  const removable = REMOVABLE_TYPES.includes(c.case_type)
  return PRODUCTION_STEPS.filter(s => !s.removableOnly || removable)
}

function ProductionSteps({ caseRow, onStepClick }) {
  return (
    <div className="flex items-center gap-1">
      {stepsForCase(caseRow).map(step => {
        const done = !!caseRow[step.atField]
        const title = done
          ? `${step.label} — ${caseRow[step.byField] || 'unknown'}, ${new Date(caseRow[step.atField]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : `${step.label} — not yet. Click to mark.`
        return (
          <button
            key={step.key}
            type="button"
            title={title}
            onClick={() => onStepClick(caseRow, step)}
            className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors flex-shrink-0 ${
              done
                ? 'bg-[#06babe] text-white hover:bg-[#0597a0]'
                : 'bg-gray-100 text-gray-400 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500'
            }`}
          >
            {step.badge}
          </button>
        )
      })}
    </div>
  )
}

function QuickStepModal({ caseRow, step, onClose, onSaved }) {
  const [by, setBy] = useState(caseRow[step.byField] || '')
  const [on, setOn] = useState(toDateInput(caseRow[step.atField]) || new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSave = async () => {
    if (!by.trim()) return setError('Who did this is required')
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/cases/${caseRow.id}`, { ...caseRow, [step.byField]: by.trim(), [step.atField]: on })
      toast(`${step.label} marked`, 'success')
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const handleClear = async () => {
    setSaving(true)
    try {
      await api.put(`/api/cases/${caseRow.id}`, { ...caseRow, [step.byField]: '', [step.atField]: null })
      toast(`${step.label} cleared`, 'success')
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to clear')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{step.label}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{caseRow.case_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">By</label>
            <StaffPicker value={by} onChange={setBy} />
          </div>
          <div>
            <label className="label">On</label>
            <input className="input" type="date" value={on} onChange={e => setOn(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          {caseRow[step.atField] && (
            <button onClick={handleClear} disabled={saving} className="btn-secondary text-xs disabled:opacity-50">Clear</button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Fields shown behind the "Production Detail" toggle — auto-expanded on
// edit when a case already has any of this filled in.
const PRODUCTION_DETAIL_FIELDS = [
  'product', 'tooth_numbers', 'quantity', 'shade', 'special_instructions',
  'evident_case_number', 'outsourcing_return_date', 'outsourcing_tracking_number',
]

function CaseModal({ caseData, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (!caseData) return EMPTY_FORM
    const merged = { ...EMPTY_FORM, ...caseData }
    DATE_FIELDS.forEach(f => { merged[f] = toDateInput(merged[f]) })
    return merged
  })
  const [showProduction, setShowProduction] = useState(() =>
    !!caseData && PRODUCTION_DETAIL_FIELDS.some(f => caseData[f])
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isRemovable = REMOVABLE_TYPES.includes(form.case_type)

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
              <StaffPicker value={form.assigned_technician} onChange={v => set('assigned_technician', v)} />
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

            <div className="col-span-2 pt-2 mt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowProduction(v => !v)}
                className="text-xs font-semibold text-[#06babe] hover:text-[#207290] flex items-center gap-1.5"
              >
                <span className={`transition-transform ${showProduction ? 'rotate-90' : ''}`}>▸</span>
                Production Detail {!showProduction && <span className="text-gray-400 font-normal">(product, tooth #, shade, Evident #...)</span>}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Sterilized / Entered / Plaster / Packed are tracked from the case row's status dots, not here.
              </p>
            </div>

            {showProduction && (
              <>
                <div>
                  <label className="label">Product</label>
                  <input className="input" value={form.product} onChange={e => set('product', e.target.value)} placeholder="e.g. PFM Crown, Valplast Partial" />
                </div>
                <div>
                  <label className="label">Tooth Number(s)</label>
                  <input className="input" value={form.tooth_numbers} onChange={e => set('tooth_numbers', e.target.value)} placeholder="e.g. 8, 9" />
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input className="input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>
                <div>
                  <label className="label">Shade</label>
                  <input className="input" value={form.shade} onChange={e => set('shade', e.target.value)} placeholder="e.g. A2" />
                </div>
                <div>
                  <label className="label">Evident Case # <span className="text-gray-400 font-normal">(Evident system reference)</span></label>
                  <input className="input font-mono" value={form.evident_case_number} onChange={e => set('evident_case_number', e.target.value)} />
                </div>
                <div />
                <div className="col-span-2">
                  <label className="label">Special Instructions <span className="text-gray-400 font-normal">(mirrors Evident's Special Instructions field)</span></label>
                  <textarea className="input resize-none" rows={2} value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} placeholder="Doctor's special instructions for this case..." />
                </div>

                {isRemovable && (
                  <>
                    <div className="col-span-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outsourcing</h3>
                    </div>
                    <div>
                      <label className="label">Outsourcing Lab Return-By Date</label>
                      <input className="input" type="date" value={form.outsourcing_return_date} onChange={e => set('outsourcing_return_date', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Outsourcing Tracking #</label>
                      <input className="input" value={form.outsourcing_tracking_number} onChange={e => set('outsourcing_tracking_number', e.target.value)}
                        placeholder={form.shipped_to_outsourcing_at ? '' : 'Set via "Send to Outsourcing Lab"'} />
                    </div>
                  </>
                )}
              </>
            )}

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

function ShipToOutsourcingModal({ cases, onClose, onSent }) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSend = async () => {
    if (!trackingNumber.trim()) return setError('Tracking number is required')
    setSending(true)
    setError('')
    try {
      const res = await api.post('/api/cases/ship-to-outsourcing', {
        case_ids: cases.map(c => c.id),
        tracking_number: trackingNumber.trim(),
      })
      toast(`Sent to outsourcing lab — ${res.count} case${res.count !== 1 ? 's' : ''}`, 'success')
      onSent()
    } catch (err) {
      setError(err.message || 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Truck size={16} className="text-[#06babe]" /> Send to Outsourcing Lab</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {cases.length} case{cases.length !== 1 ? 's' : ''} will be emailed to the outsourcing lab as a shipment
            spreadsheet (case #, patient, product, tooth #, quantity, shade, return date).
          </p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
            {cases.map(c => (
              <div key={c.id} className="px-3 py-1.5 text-xs flex justify-between">
                <span className="font-mono font-semibold text-gray-700">{c.case_number}</span>
                <span className="text-gray-500">{c.patient || c.client_name}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Shipment Tracking Number *</label>
            <input className="input" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="1Z999..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send'}
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
  const [view, setView] = useState('all') // 'all' | 'ready-to-ship'
  const [selectedIds, setSelectedIds] = useState([])
  const [shipModal, setShipModal] = useState(false)
  const [stepModal, setStepModal] = useState(null) // { caseRow, step } | null
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

  const handleStepClick = (caseRow, step) => setStepModal({ caseRow, step })

  const readyToShip = cases.filter(c =>
    REMOVABLE_TYPES.includes(c.case_type) && c.packed_at && !c.shipped_to_outsourcing_at
  )
  const toggleSelected = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )
  const selectedCases = readyToShip.filter(c => selectedIds.includes(c.id))

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
          <h1 className="page-title">Cases</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-3">
            {cases.length} total
            {dueSoonCount > 0 && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle size={12} /> {dueSoonCount} due soon</span>}
            {overdueCount > 0 && <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle size={12} /> {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(v => v === 'ready-to-ship' ? 'all' : 'ready-to-ship')}
            className={`btn-secondary flex items-center gap-2 text-xs ${view === 'ready-to-ship' ? 'ring-1 ring-[#06babe]' : ''}`}
          >
            <Package size={13} /> Ready to Ship
            {readyToShip.length > 0 && <span className="bg-[#06babe]/10 text-[#06babe] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{readyToShip.length}</span>}
          </button>
          <button onClick={fetchCases} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} /></button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Case</button>
        </div>
      </div>

      {view === 'all' ? (
        <>
          {/* Stage filter tabs — scrollable */}
          <div className="overflow-x-auto pb-1 mb-5 no-scrollbar">
            <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
              {['All', ...STAGES].map(stage => (
                <button key={stage} onClick={() => setActiveStage(stage)}
                  className={`tab-item ${activeStage === stage ? 'tab-item-active' : ''}`}
                >
                  {stage}
                  <span className="ml-1 text-slate-400 dark:text-slate-500 text-[10px]">{stageCounts[stage] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search case #, client, patient, type..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
              <option value="All">All Brands</option>
              {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <SkeletonTable rows={5} cols={11} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="No cases found"
                description={search ? 'Try a different search term or filter.' : 'Add your first case to get started.'}
                action={!search ? () => setModal('new') : undefined}
                actionLabel="New Case"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['Case #', 'Client', 'Patient', 'Brand', 'Type', 'Due Date', 'Value', 'Priority', 'Stage', 'Production', ''].map(h => (
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
                            <ProductionSteps caseRow={c} onStepClick={handleStepClick} />
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
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Removable cases (Dentures/Partial) that are packed and awaiting shipment to the outsourcing lab.
            </p>
            <button
              onClick={() => setShipModal(true)}
              disabled={selectedIds.length === 0}
              className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Truck size={13} /> Send to Outsourcing Lab {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </div>
          {readyToShip.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nothing ready to ship"
              description="Removable cases show up here once they're packed and haven't been sent to the outsourcing lab yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['', 'Case #', 'Patient', 'Product', 'Tooth #', 'Qty', 'Shade', 'Return By', 'Packed'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {readyToShip.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelected(c.id)} className="cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.case_number}</td>
                      <td className="px-4 py-3 text-gray-500">{c.patient || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.product || c.case_type}</td>
                      <td className="px-4 py-3 text-gray-500">{c.tooth_numbers || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.quantity ?? 1}</td>
                      <td className="px-4 py-3 text-gray-500">{c.shade || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.outsourcing_return_date ? new Date(c.outsourcing_return_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {c.packed_at ? new Date(c.packed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}{c.packed_by ? ` · ${c.packed_by}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <CaseModal
            caseData={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchCases() }}
          />
        )}
        {shipModal && (
          <ShipToOutsourcingModal
            cases={selectedCases}
            onClose={() => setShipModal(false)}
            onSent={() => { setShipModal(false); setSelectedIds([]); fetchCases() }}
          />
        )}
        {stepModal && (
          <QuickStepModal
            caseRow={stepModal.caseRow}
            step={stepModal.step}
            onClose={() => setStepModal(null)}
            onSaved={() => { setStepModal(null); fetchCases() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
