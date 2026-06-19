import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Plus, Search, X, Phone, Mail, Star, Upload, Download, Check, Archive, ArchiveRestore, UserCheck } from 'lucide-react'

const STATUS_OPTIONS = ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost', 'Pending']
const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
const LEAD_SOURCES = ['Referral', 'Google', 'LinkedIn', 'Facebook', 'Instagram', 'X (Twitter)', 'Office Visit', 'Walk-in', 'Other']
const INTENT_OPTIONS = ['High', 'Medium', 'Low']

const STATUS_CLASSES = {
  Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
  Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending',
}

const INTENT_CLASSES = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-gray-100 text-gray-500',
}

const EMPTY_FORM = {
  doctor_name: '', clinic_name: '', brand: 'Aim Dental', case_interest: '', phone: '',
  email: '', lead_source: '', estimated_value: '', status: 'Lead',
  intent_level: 'Medium', notes: '',
}

const CSV_TEMPLATE = [
  'Doctor Name,Clinic Name,Brand,Case Interest,Phone,Email,Lead Source,Estimated Value,Notes',
  'Dr. Jane Smith,Smith Dental Group,Aim Dental,Implant,(718) 555-0100,dr.smith@example.com,Referral,8500,Interested in full arch implants',
].join('\n')

// Live score preview — kept client-side for UI feedback; backend recalculates on save
const SOURCE_SCORES = {
  Referral: 25, LinkedIn: 20, 'Office Visit': 20, Google: 15,
  'Walk-in': 12, Facebook: 10, Instagram: 10, 'X (Twitter)': 8,
}
const CASE_SCORES = { Implant: 15, 'Crown & Bridge': 12, Ortho: 10, Dentures: 8, Partial: 5 }
const INTENT_SCORES = { High: 20, Medium: 10, Low: 0 }

function scoreFromLead(lead) {
  let s = 0
  s += SOURCE_SCORES[lead.lead_source || lead.referral_source] || 0
  const val = Number(lead.estimated_value) || 0
  if (val >= 8000) s += 25
  else if (val >= 4000) s += 15
  else if (val >= 2000) s += 10
  else s += 5
  s += CASE_SCORES[lead.case_interest] || 0
  s += INTENT_SCORES[lead.intent_level] || 0
  if (lead.email) s += 5
  if (lead.phone) s += 5
  return Math.min(s, 100)
}

function scoreColor(s) {
  if (s >= 80) return 'text-green-600 bg-green-50'
  if (s >= 60) return 'text-amber-600 bg-amber-50'
  return 'text-red-500 bg-red-50'
}

// ── CSV parsing (client-side for preview step) ────────────────────────────────

function parseCsvLine(line) {
  const cells = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cells.push(cur.trim())
  return cells
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  )
  const col = (...keys) => { for (const k of keys) { const i = headers.indexOf(k); if (i >= 0) return i } return -1 }
  const map = {
    doctor_name:     col('doctor_name', 'doctor'),
    clinic_name:     col('clinic_name', 'clinic'),
    brand:           col('brand'),
    case_interest:   col('case_interest', 'case_type', 'case'),
    phone:           col('phone'),
    email:           col('email'),
    lead_source:     col('lead_source', 'referral_source', 'source'),
    estimated_value: col('estimated_value', 'value'),
    notes:           col('notes'),
  }

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line)
    const g = (k) => map[k] >= 0 ? (cells[map[k]] || '').trim() : ''
    const doctor_name = g('doctor_name')
    if (!doctor_name) return null
    return {
      doctor_name,
      clinic_name:     g('clinic_name'),
      brand:           BRAND_OPTIONS.includes(g('brand')) ? g('brand') : 'Aim Dental',
      case_interest:   CASE_TYPES.includes(g('case_interest')) ? g('case_interest') : '',
      phone:           g('phone'),
      email:           g('email'),
      lead_source:     g('lead_source'),
      estimated_value: g('estimated_value'),
      notes:           g('notes'),
      status:          'Lead',
      intent_level:    'Medium',
    }
  }).filter(Boolean)
}

// ── LeadModal ─────────────────────────────────────────────────────────────────

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead ? {
    ...EMPTY_FORM, ...lead,
    lead_source:  lead.lead_source || lead.referral_source || '',
    intent_level: lead.intent_level || 'Medium',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const liveScore = scoreFromLead({ ...form, estimated_value: Number(form.estimated_value) || 0 })

  const handleSave = async () => {
    if (!form.doctor_name.trim()) return setError('Doctor name is required')
    setSaving(true)
    setError('')
    try {
      const data = {
        ...form,
        estimated_value: Number(form.estimated_value) || 0,
        referral_source: form.lead_source,
      }
      if (lead?.id) {
        await api.put(`/api/leads/${lead.id}`, data)
      } else {
        await api.post('/api/leads', data)
      }
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900">{lead?.id ? 'Edit Lead' : 'New Lead'}</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(liveScore)}`}>
              Score: {liveScore}
            </span>
          </div>
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
              <label className="label">Intent Level</label>
              <select className="input" value={form.intent_level} onChange={e => set('intent_level', e.target.value)}>
                {INTENT_OPTIONS.map(i => <option key={i}>{i}</option>)}
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

// ── CsvImportModal ────────────────────────────────────────────────────────────

function CsvImportModal({ onClose, onImport, filename, setFilename }) {
  const fileRef   = useRef(null)
  const [rows,       setRows]       = useState([])
  const [step,       setStep]       = useState('pick')
  const [importing,  setImporting]  = useState(false)
  const [result,     setResult]     = useState(null)
  const [parseError, setParseError] = useState('')
  const [localFilename, setLocalFilename] = useState('')

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.csv$/i)) { setParseError('Please select a .csv file'); return }
    setLocalFilename(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setParseError('')
      const parsed = parseCsv(ev.target.result)
      if (parsed.length === 0) {
        setParseError('No valid rows found. Make sure the file has a header row and at least one row with a Doctor Name.')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await api.post('/api/leads/import', { rows, filename: localFilename })
      setResult({ added: res.added, skipped: res.skipped })
      setStep('done')
    } catch (err) {
      setParseError(err.message || 'Import failed. Please try again.')
    }
    setImporting(false)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'leads-template.csv'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Import Leads from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        {step === 'pick' && (
          <div className="p-6 flex-1">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-[#06babe]/50 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            >
              <Upload size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">Drop a CSV here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">One lead per row — Doctor Name is required</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
            </div>
            {parseError && <p className="mt-3 text-sm text-red-600">{parseError}</p>}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Expected columns (in any order):</p>
                <p className="text-xs text-gray-500 font-mono">
                  Doctor Name, Clinic Name, Brand, Case Interest, Phone, Email, Lead Source, Estimated Value, Notes
                </p>
              </div>
              <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0">
                <Download size={12} /> Template
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{rows.length}</span>{' '}
                lead{rows.length !== 1 ? 's' : ''} ready to import
              </p>
              <button onClick={() => { setStep('pick'); setRows([]) }}
                className="text-xs text-gray-500 hover:text-gray-900">← Change file</button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Doctor', 'Clinic', 'Brand', 'Case', 'Value', 'Source', 'Email'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.doctor_name}</td>
                      <td className="px-3 py-2 text-gray-500">{row.clinic_name || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.brand}</td>
                      <td className="px-3 py-2 text-gray-500">{row.case_interest || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.estimated_value ? `$${Number(row.estimated_value).toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.lead_source || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parseError && <p className="px-6 pb-2 text-sm text-red-600">{parseError}</p>}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleImport} disabled={importing}
                className="btn-primary flex-1 disabled:opacity-50">
                {importing ? 'Importing...' : `Import ${rows.length} Lead${rows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && result && (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <Check size={22} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-3">Import complete</h3>
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold text-green-600">
                {result.added} lead{result.added !== 1 ? 's' : ''}
              </span>{' '}added successfully
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-gray-400">
                {result.skipped} skipped — duplicate email{result.skipped > 1 ? 's' : ''} already in the system
              </p>
            )}
            <button onClick={() => { onImport(); onClose() }} className="btn-primary mt-6">View Leads</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Leads() {
  const [leads,        setLeads]       = useState([])
  const [loading,      setLoading]     = useState(true)
  const [search,       setSearch]      = useState('')
  const [filterBrand,  setFilterBrand] = useState('All')
  const [filterStatus, setFilterStatus]= useState('All')
  const [showArchived, setShowArchived]= useState(false)
  const [modal,        setModal]       = useState(null)
  const [importModal,  setImportModal] = useState(false)
  const [converting,   setConverting]  = useState(null)
  const toast = useToast()

  const fetchLeads = async () => {
    setLoading(true)
    const data = await api.get(`/api/leads?archived=${showArchived}`).catch(() => [])
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [showArchived])

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      l.doctor_name.toLowerCase().includes(q) ||
      (l.clinic_name || '').toLowerCase().includes(q) ||
      (l.case_interest || '').toLowerCase().includes(q)
    return matchSearch &&
      (filterBrand  === 'All' || l.brand  === filterBrand) &&
      (filterStatus === 'All' || l.status === filterStatus)
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    await api.delete(`/api/leads/${id}`).catch(console.error)
    toast('Lead deleted', 'success')
    fetchLeads()
  }

  const handleContactNow = async (lead) => {
    await api.post(`/api/leads/${lead.id}/contacted`).catch(console.error)
    toast('Marked as contacted', 'success')
    fetchLeads()
  }

  const handleArchive = async (lead) => {
    const action = lead.is_archived ? 'unarchive' : 'archive'
    await api.post(`/api/leads/${lead.id}/${action}`).catch(console.error)
    toast(lead.is_archived ? 'Lead restored' : 'Lead archived', 'success')
    fetchLeads()
  }

  const handleConvert = async (lead) => {
    if (lead.converted_to_client_id) return toast('Already converted to client', 'info')
    if (!confirm(`Convert "${lead.doctor_name}" to a client? This will create a new client record.`)) return
    setConverting(lead.id)
    try {
      await api.post(`/api/leads/${lead.id}/convert`)
      toast(`${lead.doctor_name} converted to client!`, 'success')
      fetchLeads()
    } catch (err) {
      toast(err.message, 'error')
    }
    setConverting(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} {showArchived ? 'archived' : 'active'} leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowArchived(v => !v)}
            className={`btn-secondary flex items-center gap-2 text-xs ${showArchived ? 'ring-1 ring-[#06babe]' : ''}`}
          >
            <Archive size={13} /> {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button onClick={() => setImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

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
                  {['Doctor / Clinic', 'Brand', 'Case', 'Value', 'Intent', 'Score', 'Status', 'Contact', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
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
                        <p className="font-medium text-gray-900">{lead.doctor_name}</p>
                        <p className="text-xs text-gray-400">{lead.clinic_name}</p>
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
                        {lead.intent_level ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTENT_CLASSES[lead.intent_level] || 'bg-gray-100 text-gray-500'}`}>
                            {lead.intent_level}
                          </span>
                        ) : '—'}
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
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          {!showArchived && (
                            <button onClick={() => handleContactNow(lead)} className="text-xs text-[#06babe] hover:underline">
                              Contacted
                            </button>
                          )}
                          {lead.status === 'Won' && !lead.converted_to_client_id && !showArchived && (
                            <button
                              onClick={() => handleConvert(lead)}
                              disabled={converting === lead.id}
                              className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                            >
                              <UserCheck size={11} />
                              {converting === lead.id ? '…' : 'Convert'}
                            </button>
                          )}
                          {lead.converted_to_client_id && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5"><UserCheck size={10} /> Client</span>
                          )}
                          <button onClick={() => setModal(lead)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                          <button onClick={() => handleArchive(lead)} className="text-xs text-gray-400 hover:text-amber-600" title={showArchived ? 'Restore' : 'Archive'}>
                            {showArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                          </button>
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

      {importModal && (
        <CsvImportModal
          onClose={() => setImportModal(false)}
          onImport={fetchLeads}
        />
      )}
    </div>
  )
}
