import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [
      { freq: 1047, start: 0,    dur: 0.35 },
      { freq: 1319, start: 0.13, dur: 0.4  },
      { freq: 1568, start: 0.26, dur: 0.5  },
    ]
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    })
  } catch {}
}

const TYPE_STYLE = {
  cold_lead:     { dot: 'bg-amber-400', label: 'Cold Lead' },
  case_due:      { dot: 'bg-red-400',   label: 'Due Soon' },
  lost_recovery: { dot: 'bg-blue-400',  label: 'Recovery' },
  win_streak:    { dot: 'bg-green-400', label: 'Streak' },
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AlertsBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const prevUnreadRef = useRef(null)

  const fetchAlerts = async () => {
    const data = await api.get('/api/alerts').catch(() => [])
    const list = data || []
    const newUnread = list.filter(a => !a.read).length
    if (prevUnreadRef.current !== null && newUnread > prevUnreadRef.current) {
      playChime()
    }
    prevUnreadRef.current = newUnread
    setAlerts(list)
  }

  useEffect(() => {
    fetchAlerts()
    const t = setInterval(fetchAlerts, 30000)
    return () => clearInterval(t)
  }, [])

  const unread = alerts.filter(a => !a.read).length

  const markRead = async (id) => {
    await api.put(`/api/alerts/${id}/read`).catch(console.error)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const dismissAll = async () => {
    if (!alerts.some(a => !a.read)) return
    await api.put('/api/alerts/read-all').catch(console.error)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); fetchAlerts() }}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Open alerts"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[92vw] bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-[#06babe]" />
                <h2 className="font-semibold text-gray-900 text-sm">Alerts</h2>
                {unread > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={dismissAll} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50">
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Bell size={30} className="text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">No alerts yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Go to Automations and click "Run All Now" to generate alerts
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {alerts.map(a => {
                    const style = TYPE_STYLE[a.type] || { dot: 'bg-gray-300', label: '' }
                    return (
                      <div key={a.id} className={`px-4 py-3 hover:bg-gray-50/80 transition-colors ${!a.read ? 'bg-blue-50/30' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!a.read ? style.dot : 'bg-gray-200'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold leading-snug ${!a.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {a.title}
                              </p>
                              {!a.read && (
                                <button onClick={() => markRead(a.id)} className="flex-shrink-0 p-0.5 text-gray-300 hover:text-[#06babe] transition-colors rounded" title="Mark as read">
                                  <Check size={13} />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{a.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {style.label && <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{style.label}</span>}
                              <span className="text-[10px] text-gray-300">{timeAgo(a.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
