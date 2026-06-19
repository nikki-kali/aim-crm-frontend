import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react'

const STAGES = ['New Lead', 'Contacted', 'Proposal Sent', 'Negotiating', 'Closing']
const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']

const STAGE_COLORS = {
  'New Lead':      { bg: 'bg-gray-50',   border: 'border-gray-200',  dot: 'bg-gray-400'   },
  'Contacted':     { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-400'   },
  'Proposal Sent': { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-400'  },
  'Negotiating':   { bg: 'bg-purple-50', border: 'border-purple-200',dot: 'bg-purple-400' },
  'Closing':       { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500'  },
}

const EMPTY_FORM = {
  doctor_name: '', clinic_name: '', brand: 'Aim Dental',
  case_interest: '', deal_value: '', stage: 'New Lead',
  expected_close: '', notes: ''
}

function DealModal({ deal, onClose, onSave }) {
  const [form, setForm] = useState(deal || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.doctor_name.trim()) return setError('Doctor name is required')
    setSaving(true)
    setError('')
    const data = {
      ...form,
      deal_value: Number(form.deal_value) || 0,
      expected_close: form.expected_close || null,
      updated_at: new Date().toISOString(),
    }
    const res = deal?.id
      ? await supabase.from('pipeline').update(data).eq('id', deal.id)
      : await supabase.from('pipeline').insert(data)
    setSaving(false)
    if (res.error) return setError(res.error.message)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{deal?.id ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Doctor Name *</label>
              <input className="input" value={form.doctor_name} onChange={e => set('doctor_name', e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="label">Clinic</label>
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
              <label className="label">Deal Value ($)</label>
              <input className="input" type="number" value={form.deal_value} onChange={e => set('deal_value', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="input" value={form.stage} onChange={e => set('stage', e.target.value)}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expected Close</label>
              <input className="input" type="date" value={form.expected_close} onChange={e => set('expected_close', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DealCard({ deal, onEdit, onDelete, onMoveStage }) {
  const stageIdx = STAGES.indexOf(deal.stage)
  const canMoveLeft = stageIdx > 0
  const canMoveRight = stageIdx < STAGES.length - 1

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm truncate">{deal.doctor_name}</p>
          {deal.clinic_name && <p className="text-xs text-gray-400 truncate">{deal.clinic_name}</p>}
        </div>
        <span className={deal.brand === 'Aim Dental' ? 'badge-aim ml-2 flex-shrink-0' : 'badge-kh ml-2 flex-shrink-0'}>
          {deal.brand === 'Aim Dental' ? 'Aim' : 'KH'}
        </span>
      </div>

      {deal.case_interest && (
        <p className="text-xs text-gray-500 mb-2">{deal.case_interest}</p>
      )}

      {deal.deal_value > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <DollarSign size={12} className="text-green-600" />
          <span className="text-sm font-bold text-green-700">${Number(deal.deal_value).toLocaleString()}</span>
        </div>
      )}

      {deal.expected_close && (
        <p className="text-xs text-gray-400 mb-2">
          Close: {new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}

      {deal.notes && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{deal.notes}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex gap-1">
          <button
            onClick={() => canMoveLeft && onMoveStage(deal.id, STAGES[stageIdx - 1])}
            disabled={!canMoveLeft}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => canMoveRight && onMoveStage(deal.id, STAGES[stageIdx + 1])}
            disabled={!canMoveRight}
            className="p-1 rounded text-gray-400 hover:text-[#06babe] hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move forward"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(deal)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
          <button onClick={() => onDelete(deal.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
        </div>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBrand, setFilterBrand] = useState('All')
  const [modal, setModal] = useState(null)

  const fetchDeals = async () => {
    setLoading(true)
    const { data } = await supabase.from('pipeline').select('*').order('created_at', { ascending: true })
    setDeals(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDeals() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this deal from pipeline?')) return
    await supabase.from('pipeline').delete().eq('id', id)
    fetchDeals()
  }

  const handleMoveStage = async (id, newStage) => {
    await supabase.from('pipeline').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', id)
    fetchDeals()
  }

  const filtered = deals.filter(d => filterBrand === 'All' || d.brand === filterBrand)

  const totalPipelineValue = filtered.reduce((s, d) => s + Number(d.deal_value || 0), 0)

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} deals · <span className="font-medium text-green-700">${totalPipelineValue.toLocaleString()} total value</span>
          </p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="All">All Brands</option>
            {BRAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-5 gap-4 min-h-[60vh]">
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage)
            const stageValue = stageDeals.reduce((s, d) => s + Number(d.deal_value || 0), 0)
            const colors = STAGE_COLORS[stage]

            return (
              <div key={stage} className={`rounded-xl border ${colors.border} ${colors.bg} p-3 flex flex-col`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-xs font-semibold text-gray-700">{stage}</span>
                  </div>
                  <span className="text-xs bg-white text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200">
                    {stageDeals.length}
                  </span>
                </div>

                {stageValue > 0 && (
                  <p className="text-xs text-gray-500 mb-3 font-medium">${stageValue.toLocaleString()}</p>
                )}

                {/* Cards */}
                <div className="space-y-2 flex-1">
                  {stageDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={setModal}
                      onDelete={handleDelete}
                      onMoveStage={handleMoveStage}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">No deals</div>
                  )}
                </div>

                <button
                  onClick={() => setModal({ ...EMPTY_FORM, stage })}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-white/60 py-2 rounded-lg border border-dashed border-gray-300 transition-colors"
                >
                  + Add deal
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <DealModal
          deal={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchDeals() }}
        />
      )}
    </div>
  )
}
