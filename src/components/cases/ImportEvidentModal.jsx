import { useEffect, useRef, useState } from 'react'
import api from '../../lib/api'
import AnimatedModal from '../AnimatedModal'
import { Upload, X, Check, AlertTriangle } from 'lucide-react'
import { parseEvidentCsv } from '../../lib/evidentImport'

// Mirrors Leads.jsx's CsvImportModal (pick → preview → done), but for an
// Evident "Booked Cases" export, which has no rep column of its own — the
// admin picks which rep this batch belongs to before importing.
export default function ImportEvidentModal({ onClose, onImported }) {
  const fileRef = useRef(null)
  const [csvFile, setCsvFile] = useState(null)
  const [rows, setRows] = useState([])
  const [step, setStep] = useState('pick')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [parseError, setParseError] = useState('')
  const [repId, setRepId] = useState('')
  const [reps, setReps] = useState([])

  useEffect(() => { api.get('/api/users/reps').then(data => setReps(data || [])).catch(() => {}) }, [])

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.csv$/i)) { setParseError('Please select a .csv file'); return }
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setParseError('')
      const parsed = parseEvidentCsv(ev.target.result)
      if (parsed.length === 0) {
        setParseError('No valid rows found. Make sure the file has a header row and at least one row with a Ref and Customer Name.')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!repId) { setParseError('Pick which rep this export belongs to.'); return }
    setImporting(true)
    setParseError('')
    try {
      const res = await api.post('/api/cases/import-evident', { rep_id: repId, rows })
      setResult(res)
      setStep('done')
    } catch (err) {
      setParseError(err.message || 'Import failed. Please try again.')
    }
    setImporting(false)
  }

  const totalValue = rows.reduce((s, r) => s + (r.total || r.billed + r.wip), 0)

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="2xl"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Import Booked Cases from Evident</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        step === 'preview' ? (
          <div className="flex gap-3 px-6 py-4">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleImport} disabled={importing || !repId}
              className="btn-primary flex-1 disabled:opacity-50">
              {importing ? 'Importing...' : `Import ${rows.length} Case${rows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        ) : null
      }
    >
      {step === 'pick' && (
        <div className="p-6 space-y-4">
          <div
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 sm:p-10 text-center hover:border-[#06babe]/50 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          >
            <Upload size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop the Evident export here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">A "Booked Cases" CSV export, filtered to one sales rep at a time</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>
          {parseError && <p className="text-sm text-red-600">{parseError}</p>}

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Expected columns:</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Ref, Case Number, Customer Name, Product Name, Sales Value (Total Billed), Sales Value (Total WIP), Sales Value (Total), First Arrival
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <>
          <div className="px-6 py-3 border-b border-slate-50 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{rows.length}</span>{' '}
                case{rows.length !== 1 ? 's' : ''} · <span className="font-semibold text-[#06babe]">${totalValue.toLocaleString()}</span> total
              </p>
              <button onClick={() => { setStep('pick'); setRows([]); setCsvFile(null) }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex-shrink-0">← Change file</button>
            </div>
            <div>
              <label className="label">This export belongs to</label>
              <select className="input" value={repId} onChange={e => setRepId(e.target.value)}>
                <option value="">— Select a rep —</option>
                {reps.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  {['Ref', 'Patient', 'Doctor', 'Product', 'Billed', 'WIP', 'Total', 'First Arrival'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{row.ref}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{row.patient || '—'}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{row.customer_name}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{row.product_name || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{row.billed ? `$${row.billed.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{row.wip ? `$${row.wip.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">${(row.total || row.billed + row.wip).toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{row.first_arrival || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden p-3 space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{row.customer_name}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{row.product_name || '—'} · {row.patient || '—'}</p>
                <p className="text-slate-500 dark:text-slate-400">${(row.total || row.billed + row.wip).toLocaleString()} · {row.first_arrival || '—'}</p>
              </div>
            ))}
          </div>

          {parseError && <p className="px-6 py-2 text-sm text-red-600">{parseError}</p>}
        </>
      )}

      {step === 'done' && result && (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center mb-4">
            <Check size={22} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Import complete</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
            <span className="font-semibold text-green-600">{result.createdCases} case{result.createdCases !== 1 ? 's' : ''} added</span>
            {result.updatedCases > 0 && <>, <span className="font-semibold text-[#06babe]">{result.updatedCases} updated</span></>}
          </p>
          {result.createdClients > 0 && (
            <p className="text-sm text-slate-400">{result.createdClients} new client{result.createdClients !== 1 ? 's' : ''} created</p>
          )}
          {result.skipped > 0 && (
            <p className="text-sm text-slate-400">{result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped — missing doctor or $0 value</p>
          )}
          {result.conflicts?.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-left w-full">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle size={12} /> {result.conflicts.length} rep conflict{result.conflicts.length !== 1 ? 's' : ''}
              </p>
              {result.conflicts.map((c, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{c.doctor_name} — {c.reason}</p>
              ))}
            </div>
          )}
          <button onClick={() => { onImported(); onClose() }} className="btn-primary mt-6">View Cases</button>
        </div>
      )}
    </AnimatedModal>
  )
}
