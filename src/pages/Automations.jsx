import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Clock, Calendar, RefreshCw, TrendingUp, Zap, Play, Check, AlertCircle } from 'lucide-react'

const AUTOMATION_META = {
  cold_lead: {
    icon: Clock,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    description: 'Scans active leads and flags anyone with no contact in 14+ days so you can follow up before they go cold.',
  },
  case_due: {
    icon: Calendar,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    description: 'Checks for lab cases with a due date within the next 2 days that haven\'t been delivered yet.',
  },
  lost_recovery: {
    icon: RefreshCw,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    description: 'Finds leads marked Lost 30+ days ago that are worth re-approaching for a second chance.',
  },
  win_streak: {
    icon: TrendingUp,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-50',
    description: 'Detects when 3 or more consecutive resolved leads are all wins and posts a streak alert to celebrate.',
  },
}

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? 'bg-[#06babe]' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

export default function Automations() {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [migrationMissing, setMigrationMissing] = useState(false)
  const [running, setRunning] = useState({})
  const [runningAll, setRunningAll] = useState(false)
  const [results, setResults] = useState({})

  useEffect(() => { fetchAutomations() }, [])

  const fetchAutomations = async () => {
    setMigrationMissing(false)
    try {
      const data = await api.get('/api/automations')
      setAutomations(data || [])
    } catch {
      setMigrationMissing(true)
    }
    setLoading(false)
  }

  const toggleAutomation = async (id, enabled) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled } : a))
    await api.put(`/api/automations/${id}`, { enabled }).catch(console.error)
  }

  const runOne = async (auto) => {
    setRunning(prev => ({ ...prev, [auto.key]: true }))
    try {
      const result = await api.post(`/api/automations/run/${auto.key}`)
      const now = new Date().toISOString()
      const newCount = (auto.run_count || 0) + 1
      setAutomations(prev => prev.map(a =>
        a.id === auto.id ? { ...a, last_run_at: now, run_count: newCount } : a
      ))
      setResults(prev => ({ ...prev, [auto.key]: result }))
      setTimeout(() => setResults(prev => {
        const n = { ...prev }; delete n[auto.key]; return n
      }), 6000)
    } catch (e) {
      setResults(prev => ({ ...prev, [auto.key]: { message: 'Error: ' + e.message, found: false } }))
    } finally {
      setRunning(prev => { const n = { ...prev }; delete n[auto.key]; return n })
    }
  }

  const runAll = async () => {
    setRunningAll(true)
    try {
      const allResults = await api.post('/api/automations/run')
      const now = new Date().toISOString()
      setAutomations(prev => prev.map(a => a.enabled ? { ...a, last_run_at: now, run_count: (a.run_count || 0) + 1 } : a))
      setResults(allResults)
      setTimeout(() => setResults({}), 6000)
    } catch (e) {
      console.error('Run all error:', e)
    }
    setRunningAll(false)
  }

  const timeAgo = (ts) => {
    if (!ts) return 'Never'
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  if (migrationMissing) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="card p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
        <h2 className="font-semibold text-gray-900 mb-2">Setup Required</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          Run <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">automations-setup.sql</code> in your Supabase SQL Editor.
        </p>
        <button onClick={fetchAutomations} className="btn-secondary text-sm">Retry</button>
      </div>
    </div>
  )

  const enabledCount = automations.filter(a => a.enabled).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{enabledCount} of {automations.length} rules active</p>
        </div>
        <button onClick={runAll} disabled={runningAll || enabledCount === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Zap size={14} />
          {runningAll ? 'Running...' : 'Run All Now'}
        </button>
      </div>

      <div className="grid gap-4">
        {automations.map(auto => {
          const meta = AUTOMATION_META[auto.key]
          if (!meta) return null
          const Icon = meta.icon
          const isRunning = !!running[auto.key]
          const result = results[auto.key]
          const busy = isRunning || runningAll

          return (
            <div key={auto.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={18} className={meta.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{auto.name}</h3>
                    <Toggle enabled={auto.enabled} onChange={(v) => toggleAutomation(auto.id, v)} disabled={busy} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.description}</p>
                  {result && (
                    <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${result.found ? 'text-amber-600' : 'text-green-600'}`}>
                      <Check size={12} />
                      {result.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-3 flex-wrap">
                <p className="text-xs text-gray-400">
                  Last run: <span className="text-gray-600 font-medium">{timeAgo(auto.last_run_at)}</span>
                  {auto.run_count > 0 && <span className="ml-2 text-gray-300">· {auto.run_count} total run{auto.run_count > 1 ? 's' : ''}</span>}
                </p>
                <button onClick={() => runOne(auto)} disabled={busy || !auto.enabled} className="btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-40">
                  {isRunning ? (
                    <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Running...</>
                  ) : (
                    <><Play size={11} />Run Now</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 card p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">How it works:</span>{' '}
          Automations run automatically on the server every day at 8:00 AM and send email alerts. You can also trigger them manually with "Run All Now".
        </p>
      </div>
    </div>
  )
}
