import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import AnimatedModal from '../components/AnimatedModal'
import CaseCard from '../components/cases/CaseCard'
import CaseProgressSheet from '../components/cases/CaseProgressSheet'
import ImportEvidentModal from '../components/cases/ImportEvidentModal'
import { Plus, Search, X, AlertTriangle, Calendar, Mail, RefreshCw, Truck, Package, Upload } from 'lucide-react'
import { SkeletonTable, SkeletonCards } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import {
  BRAND_OPTIONS, CASE_TYPES, PRIORITY_OPTIONS, REMOVABLE_TYPES, STAGES,
  STAGE_COLORS, PRIORITY_CLASSES, EMPTY_FORM, DATE_FIELDS, STAFF_OPTIONS,
  PRODUCTION_STEPS, daysUntil, toDateInput,
} from '../lib/cases'

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

// Live search over existing leads + clients so a new case can link back to
// the doctor's real record instead of a disconnected free-text name.
// Picking a lead (vs. a client, vs. just typing) is what lets that lead
// auto-convert into a client on save — see POST /api/cases.
function ClientPicker({ value, onChange, onSelectLead }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState({ leads: [], clients: [] })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults({ leads: [], clients: [] }); return }
    setLoading(true)
    const timer = setTimeout(() => {
      Promise.all([
        api.get(`/api/leads?search=${encodeURIComponent(q)}&view=all`).catch(() => []),
        api.get(`/api/clients?search=${encodeURIComponent(q)}`).catch(() => []),
      ]).then(([leads, clients]) => {
        setResults({
          leads: leads.filter(l => !l.converted_to_client_id).slice(0, 6),
          clients: clients.slice(0, 6),
        })
        setLoading(false)
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleTextChange = (v) => {
    setQuery(v)
    onChange(v)
    onSelectLead(null)
    setOpen(true)
  }

  const pick = (name, leadId) => {
    setQuery(name)
    onChange(name)
    onSelectLead(leadId || null)
    setOpen(false)
  }

  const hasResults = results.leads.length > 0 || results.clients.length > 0

  return (
    <div className="relative">
      <input
        className="input"
        value={query}
        onChange={e => handleTextChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Dr. Jane Smith"
      />
      {open && query.trim().length >= 2 && (loading || hasResults) && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          {loading && <div className="px-3 py-2 text-slate-400">Searching…</div>}
          {!loading && results.clients.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Existing Clients</div>
              {results.clients.map(c => (
                <button type="button" key={c.id} onMouseDown={() => pick(c.doctor_name, null)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700">
                  {c.doctor_name} {c.clinic_name && <span className="text-slate-400">— {c.clinic_name}</span>}
                </button>
              ))}
            </>
          )}
          {!loading && results.leads.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Leads (not yet a client)</div>
              {results.leads.map(l => (
                <button type="button" key={l.id} onMouseDown={() => pick(l.doctor_name, l.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700">
                  {l.doctor_name} {l.clinic_name && <span className="text-slate-400">— {l.clinic_name}</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">
        Pick an existing lead or client if they're already in the CRM — picking a lead automatically moves them into Clients.
      </p>
    </div>
  )
}

// Desktop-only inline dots (table row). Mobile uses the enlarged tap targets
// inside CaseCard instead.
function ProductionSteps({ caseRow, onStepClick }) {
  return (
    <div data-tour="cases-production-dots" className="flex items-center gap-1">
      {PRODUCTION_STEPS.map(step => {
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

function QuickStepModal({ caseRow, step, zIndex, onClose, onSaved }) {
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
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      zIndex={zIndex}
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{step.label}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{caseRow.case_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={16} /></button>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 px-5 py-4">
          {caseRow[step.atField] && (
            <button onClick={handleClear} disabled={saving} className="btn-secondary text-xs disabled:opacity-50 w-full sm:w-auto">Clear</button>
          )}
          <button onClick={onClose} className="btn-secondary w-full sm:flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full sm:flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="label">By</label>
          <StaffPicker value={by} onChange={setBy} />
        </div>
        <div>
          <label className="label">On</label>
          <input className="input" type="date" value={on} onChange={e => setOn(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
      </div>
    </AnimatedModal>
  )
}

function fmtTimelineDate(ts) {
  return ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null
}

function TimelineRow({ label, done, timestamp, sublabel }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-[#06babe]' : 'bg-slate-300 dark:bg-slate-600'}`} />
      <span className={done ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>{label}</span>
      {sublabel && <span className="text-slate-400 text-[10.5px]">({sublabel})</span>}
      {timestamp && <span className="text-slate-400 ml-auto flex-shrink-0">{timestamp}</span>}
      {!timestamp && done && <span className="text-slate-400 ml-auto flex-shrink-0 italic">not recorded</span>}
    </div>
  )
}

// Combines three real, already-separately-tracked data sources into one
// read-only chronological view: the originating pickup lead's own
// pickup_* columns (requested/dispatched/received — only present when
// this case came from a Schedule Pickup lead, via GET /api/cases'
// left join on original_lead_id), the doctor-facing STAGES pipeline
// (stage_history), and the internal PRODUCTION_STEPS checklist. Nothing
// here is editable — that already happens via the row-level status dots
// (production steps) and the Stage dropdown above (doctor-facing stage);
// this is purely "how did we get here, and when."
function CaseTimeline({ caseData }) {
  if (!caseData?.id) return null

  const hasPickup = !!caseData.pickup_status
  const PICKUP_ORDER = { requested: 0, dispatched: 1, received: 2 }
  const currentPickupIdx = hasPickup ? PICKUP_ORDER[caseData.pickup_status] : -1
  // 'received' is deliberately not its own row here — a case only exists once
  // its pickup has been received, so "Pickup Received at Lab" and the Doctor-
  // Facing Stage list's own first entry ("Case Received") below are the same
  // real-world event. Showing both read as a redundant duplicate.
  const pickupStages = [
    { key: 'requested', label: 'Pickup Requested', at: caseData.pickup_requested_at },
    { key: 'dispatched', label: 'Pickup Dispatched', at: caseData.pickup_dispatched_at },
  ]

  const stageHistory = caseData.stage_history || []
  const currentStageIdx = STAGES.indexOf(caseData.status)

  return (
    <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Timeline</h3>

      {hasPickup && (
        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Pickup</p>
          <div className="flex flex-col gap-1.5">
            {pickupStages.map((s, i) => (
              <TimelineRow key={s.key} label={s.label} done={i <= currentPickupIdx} timestamp={fmtTimelineDate(s.at)} />
            ))}
            {caseData.pickup_date && (
              <p className="text-[10.5px] text-slate-400 mt-1">Scheduled: {caseData.pickup_date} · {caseData.pickup_window}</p>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Doctor-Facing Stage</p>
        <div className="flex flex-col gap-1.5">
          {STAGES.map((stage, i) => {
            const historyEntry = stageHistory.find(h => h.stage === stage)
            return (
              <TimelineRow key={stage} label={stage} done={i <= currentStageIdx} timestamp={fmtTimelineDate(historyEntry?.changed_at)} />
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Internal Production</p>
        <div className="flex flex-col gap-1.5">
          {PRODUCTION_STEPS.map(step => (
            <TimelineRow
              key={step.key}
              label={step.label}
              done={!!caseData[step.atField]}
              timestamp={fmtTimelineDate(caseData[step.atField])}
              sublabel={caseData[step.byField] || null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Fields shown behind the "Production Detail" toggle — auto-expanded on
// edit when a case already has any of this filled in.
const PRODUCTION_DETAIL_FIELDS = [
  'product', 'tooth_numbers', 'quantity', 'shade', 'special_instructions',
  'evident_case_number', 'outsourcing_return_date', 'outsourcing_tracking_number',
]

function CaseModal({ caseData, onClose, onSave, onResend }) {
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

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="2xl"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{caseData?.id ? 'Edit Case' : 'New Case'}</h2>
          <div className="flex items-center gap-3">
            {caseData?.id && caseData?.doctor_email && (
              <button onClick={() => onResend(caseData)} title="Resend notification" className="text-xs flex items-center gap-1 text-[#06babe] hover:underline">
                <Mail size={12} /> <span className="hidden sm:inline">Resend notification</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
          </div>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Case'}
          </button>
        </div>
      }
    >
      <div className="p-6">
        <CaseTimeline caseData={form} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Case # <span className="text-slate-400 font-normal">(auto if blank)</span></label>
            <input className="input font-mono" value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="AIM-2026-001" />
          </div>
          <div>
            <label className="label">Brand</label>
            <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
              {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="label">Client / Doctor Name *</label>
            {caseData?.id ? (
              <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Dr. Jane Smith" />
            ) : (
              <ClientPicker
                value={form.client_name}
                onChange={v => set('client_name', v)}
                onSelectLead={id => set('lead_id', id)}
              />
            )}
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
            <label className="label">Doctor Email <span className="text-slate-400 font-normal">(for notifications)</span></label>
            <input className="input" type="email" value={form.doctor_email} onChange={e => set('doctor_email', e.target.value)} placeholder="dr@clinic.com" />
          </div>
          <div>
            <label className="label">Doctor Phone</label>
            <input className="input" value={form.doctor_phone} onChange={e => set('doctor_phone', e.target.value)} placeholder="(718) 555-0100" />
          </div>

          <div className="col-span-1 sm:col-span-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowProduction(v => !v)}
              className="text-xs font-semibold text-[#06babe] hover:text-[#207290] flex items-center gap-1.5"
            >
              <span className={`transition-transform ${showProduction ? 'rotate-90' : ''}`}>▸</span>
              Production Detail {!showProduction && <span className="text-slate-400 font-normal">(product, tooth #, shade, Evident #...)</span>}
            </button>
            <p className="text-xs text-slate-400 mt-1">
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
                <label className="label">Evident Case # <span className="text-slate-400 font-normal">(Evident system reference)</span></label>
                <input className="input font-mono" value={form.evident_case_number} onChange={e => set('evident_case_number', e.target.value)} />
              </div>
              <div className="hidden sm:block" />
              <div className="col-span-1 sm:col-span-2">
                <label className="label">Special Instructions <span className="text-slate-400 font-normal">(mirrors Evident's Special Instructions field)</span></label>
                <textarea className="input resize-none" rows={2} value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} placeholder="Doctor's special instructions for this case..." />
              </div>

              {isRemovable && (
                <>
                  <div className="col-span-1 sm:col-span-2">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outsourcing</h3>
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

          <div className="col-span-1 sm:col-span-2">
            <label className="label">Internal Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Production instructions..." />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg mt-4">{error}</p>}
      </div>
    </AnimatedModal>
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
    <AnimatedModal
      onClose={onClose}
      maxWidth="md"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Truck size={16} className="text-[#06babe]" /> Send to Outsourcing Lab</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {cases.length} case{cases.length !== 1 ? 's' : ''} will be emailed to the outsourcing lab as a shipment
          spreadsheet (case #, patient, product, tooth #, quantity, shade, return date).
        </p>
        <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
          {cases.map(c => (
            <div key={c.id} className="px-3 py-1.5 text-xs flex justify-between">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{c.case_number}</span>
              <span className="text-slate-500 dark:text-slate-400">{c.patient || c.client_name}</span>
            </div>
          ))}
        </div>
        <div>
          <label className="label">Shipment Tracking Number *</label>
          <input className="input" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="1Z999..." />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
      </div>
    </AnimatedModal>
  )
}

export default function Cases() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('All')
  const [activeStage, setActiveStage] = useState('All')
  const [modal, setModal] = useState(null)
  const [view, setView] = useState('all') // 'all' | 'ready-to-ship'
  const [selectedIds, setSelectedIds] = useState([])
  const [shipModal, setShipModal] = useState(false)
  const [evidentModal, setEvidentModal] = useState(false)
  const [stepModal, setStepModal] = useState(null) // { caseId, stepKey } | null
  const [progressCaseId, setProgressCaseId] = useState(null)
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

  // Delete is admin-only server-side (requireAdmin) — guard client-side too
  // so staff never see a false "deleted" success message from a silently
  // rejected 403.
  const handleDelete = async (id) => {
    if (!isAdmin) return
    if (!confirm('Delete this case?')) return
    try {
      await api.delete(`/api/cases/${id}`)
      toast('Case deleted', 'success')
      fetchCases()
    } catch (err) {
      toast(err.message || 'Failed to delete case', 'error')
    }
  }

  const handleStageChange = async (id, status) => {
    const c = cases.find(c => c.id === id)
    if (!c) return
    await api.put(`/api/cases/${id}`, { ...c, status }).catch(console.error)
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  // Stores ids, not the row object — QuickStepModal.onSaved refetches and
  // replaces `cases`, so holding a captured row here would go stale.
  const handleStepClick = (caseRow, step) => setStepModal({ caseId: caseRow.id, stepKey: step.key })

  const handleResend = async (caseRow) => {
    try {
      await api.post(`/api/cases/${caseRow.id}/resend-notification`)
      toast('Notification resent', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

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

  const progressCase = progressCaseId ? cases.find(c => c.id === progressCaseId) : null
  const stepModalCase = stepModal ? cases.find(c => c.id === stepModal.caseId) : null
  const stepModalStep = stepModal ? PRODUCTION_STEPS.find(s => s.key === stepModal.stepKey) : null

  return (
    <div className="px-4 py-5 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Cases</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {cases.length} total
            {dueSoonCount > 0 && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle size={12} /> {dueSoonCount} due soon</span>}
            {overdueCount > 0 && <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle size={12} /> {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            data-tour="cases-ready-to-ship"
            onClick={() => setView(v => v === 'ready-to-ship' ? 'all' : 'ready-to-ship')}
            className={`btn-secondary flex-1 sm:flex-none justify-center flex items-center gap-2 text-xs ${view === 'ready-to-ship' ? 'ring-1 ring-[#06babe]' : ''}`}
          >
            <Package size={13} /> Ready to Ship
            {readyToShip.length > 0 && <span className="bg-[#06babe]/10 text-[#06babe] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{readyToShip.length}</span>}
          </button>
          <button onClick={fetchCases} className="btn-secondary w-10 h-10 flex-shrink-0 flex items-center justify-center p-0"><RefreshCw size={14} /></button>
          {isAdmin && (
            <button onClick={() => setEvidentModal(true)} className="btn-secondary flex-1 sm:flex-none justify-center flex items-center gap-2 text-xs">
              <Upload size={13} /> Import from Evident
            </button>
          )}
          <button data-tour="cases-new" onClick={() => setModal('new')} className="btn-primary flex-1 sm:flex-none justify-center flex items-center gap-2"><Plus size={16} /> New Case</button>
        </div>
      </div>

      {view === 'all' ? (
        <>
          {/* Stage filter tabs — scrollable */}
          <div data-tour="cases-stage-tabs" className="overflow-x-auto pb-1 mb-5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
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

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search case #, client, patient, type..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-full sm:w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
              <option value="All">All Brands</option>
              {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          {loading ? (
            <>
              <div className="hidden md:block card overflow-hidden"><SkeletonTable rows={5} cols={11} /></div>
              <div className="md:hidden"><SkeletonCards rows={5} /></div>
            </>
          ) : filtered.length === 0 ? (
            <div className="card overflow-hidden">
              <EmptyState
                icon={Plus}
                title="No cases found"
                description={search ? 'Try a different search term or filter.' : 'Add your first case to get started.'}
                action={!search ? () => setModal('new') : undefined}
                actionLabel="New Case"
              />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block card overflow-hidden">
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
                                {isAdmin && (
                                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2.5">
                {filtered.map(c => (
                  <CaseCard
                    key={c.id}
                    caseRow={c}
                    onStepClick={handleStepClick}
                    onOpenSheet={setProgressCaseId}
                    onAdvance={handleStageChange}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="card overflow-hidden mb-4 md:mb-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Removable cases (Dentures/Partial) that are packed and awaiting shipment to the outsourcing lab.
              </p>
              <button
                onClick={() => setShipModal(true)}
                disabled={selectedIds.length === 0}
                className="hidden md:flex btn-primary text-xs items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Truck size={13} /> Send to Outsourcing Lab {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
            </div>
            <div className="hidden md:block">
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
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5 pb-4">
            {readyToShip.length === 0 ? (
              <div className="card overflow-hidden">
                <EmptyState
                  icon={Package}
                  title="Nothing ready to ship"
                  description="Removable cases show up here once they're packed and haven't been sent to the outsourcing lab yet."
                />
              </div>
            ) : readyToShip.map(c => (
              <div key={c.id} className="card p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleSelected(c.id)}
                  className="mt-1 w-5 h-5 flex-shrink-0 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{c.case_number}</span>
                    <span className="text-xs text-slate-400">
                      {c.packed_at ? new Date(c.packed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.patient || c.client_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {c.product || c.case_type} · Tooth {c.tooth_numbers || '—'} · Qty {c.quantity ?? 1}{c.shade ? ` · ${c.shade}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Return by {c.outsourcing_return_date ? new Date(c.outsourcing_return_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="md:hidden fixed inset-x-0 above-tabbar z-30 px-4">
              <button onClick={() => setShipModal(true)} className="btn-primary w-full shadow-xl flex items-center justify-center gap-2">
                <Truck size={15} /> Send to Outsourcing Lab ({selectedIds.length})
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {modal && (
          <CaseModal
            caseData={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={() => { setModal(null); fetchCases() }}
            onResend={handleResend}
          />
        )}
        {shipModal && (
          <ShipToOutsourcingModal
            cases={selectedCases}
            onClose={() => setShipModal(false)}
            onSent={() => { setShipModal(false); setSelectedIds([]); fetchCases() }}
          />
        )}
        {evidentModal && (
          <ImportEvidentModal
            onClose={() => setEvidentModal(false)}
            onImported={fetchCases}
          />
        )}
        {stepModalCase && stepModalStep && (
          <QuickStepModal
            caseRow={stepModalCase}
            step={stepModalStep}
            zIndex={progressCaseId ? 60 : 50}
            onClose={() => setStepModal(null)}
            onSaved={() => { setStepModal(null); fetchCases() }}
          />
        )}
        {progressCase && (
          <CaseProgressSheet
            caseRow={progressCase}
            isAdmin={isAdmin}
            onClose={() => setProgressCaseId(null)}
            onStageChange={handleStageChange}
            onStepClick={handleStepClick}
            onEdit={(c) => setModal(c)}
            onResend={handleResend}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
