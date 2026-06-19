import { useState, useRef, useEffect } from 'react'
import { Plus, X, Check, Zap } from 'lucide-react'
import api from '../lib/api'

const CASE_TYPES   = ['Crown & Bridge', 'Implant', 'Dentures', 'Ortho', 'Partial', 'Other']
const SOURCES      = ['Office Visit', 'Referral', 'Walk-in']
const INTENT_OPTS  = ['High', 'Medium', 'Low']
const BRAND_OPTS   = ['Aim Dental', 'Kings Highway']

const SOURCE_SCORES = { Referral: 25, 'Office Visit': 20, 'Walk-in': 12 }
const CASE_SCORES   = { Implant: 15, 'Crown & Bridge': 12, Ortho: 10, Dentures: 8, Partial: 5 }
const INTENT_SCORES = { High: 20, Medium: 10, Low: 0 }

function quickScore(lead) {
  let s = SOURCE_SCORES[lead.lead_source] || 0
  s += 5 // base value bucket (under $2k, quick-add has no value)
  s += CASE_SCORES[lead.case_interest] || 0
  s += INTENT_SCORES[lead.intent_level] || 0
  if (lead.phone) s += 5
  return Math.min(s, 100)
}

const EMPTY = {
  doctor_name: '', phone: '', brand: 'Aim Dental',
  lead_source: 'Office Visit', case_interest: '', intent_level: 'High',
}

export default function QuickLeadButton() {
  const [open,   setOpen]   = useState(false)
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')
  const nameRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) { setSaved(false); setError(''); setTimeout(() => nameRef.current?.focus(), 60) }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleClose = () => { setOpen(false); setForm(EMPTY) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.doctor_name.trim()) { setError('Doctor name is required'); return }
    if (!form.phone.trim())       { setError('Phone is required'); return }
    setSaving(true)
    setError('')

    try {
      await api.post('/api/leads', {
        ...form,
        doctor_name:     form.doctor_name.trim(),
        phone:           form.phone.trim(),
        referral_source: form.lead_source,
        estimated_value: 0,
        status:          'Lead',
        created_via:     'manual_intake',
      })
    } catch (err) {
      setSaving(false)
      setError(err.message)
      return
    }
    setSaving(false)

    setSaved(true)
    setTimeout(() => {
      handleClose()
      setSaved(false)
    }, 1200)
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Quick Lead"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#06babe] text-white shadow-lg hover:bg-[#05a9ac] hover:shadow-xl transition-all flex items-center justify-center gap-1.5 px-4 text-sm font-semibold"
        style={{ width: 'auto', height: '44px' }}
      >
        <Zap size={15} />
        Quick Lead
      </button>

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={handleClose} />
          <div className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 sm:left-auto sm:right-6 z-50 sm:w-80 sm:max-w-[92vw]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#06babe]" />
                  <h2 className="font-semibold text-gray-900 text-sm">Quick Lead</h2>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 p-1"><X size={16} /></button>
              </div>

              {saved ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <Check size={20} className="text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Lead saved!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  <div>
                    <label className="label">Doctor Name *</label>
                    <input
                      ref={nameRef}
                      className="input"
                      value={form.doctor_name}
                      onChange={e => set('doctor_name', e.target.value)}
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      className="input"
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="(718) 555-0100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Source</label>
                      <select className="input" value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
                        {SOURCES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Brand</label>
                      <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                        {BRAND_OPTS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Case Interest</label>
                      <select className="input" value={form.case_interest} onChange={e => set('case_interest', e.target.value)}>
                        <option value="">Any</option>
                        {CASE_TYPES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Intent</label>
                      <select className="input" value={form.intent_level} onChange={e => set('intent_level', e.target.value)}>
                        {INTENT_OPTS.map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : (
                      <><Plus size={14} /> Add Lead</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
