import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import {
  ChevronLeft, ChevronRight, RefreshCw, MapPin, Package, Phone, Mail,
  AlertTriangle, CalendarClock, X,
} from 'lucide-react'
import { SkeletonCard } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

// Mirrors the pickup-request lifecycle labels/colors used on the Leads page
// (src/pages/Leads.jsx) — duplicated here rather than imported from a shared
// module since Leads.jsx doesn't currently export them from one.
const PICKUP_STATUS_LABELS = { requested: 'Requested', dispatched: 'Dispatched', received: 'Received' }
const PICKUP_STATUS_CLASSES = {
  requested: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
}

const BRAND_COLORS = { 'Aim Dental': '#06babe', 'Kings Highway': '#207290' }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function BrandBadge({ brand }) {
  const color = BRAND_COLORS[brand] || '#64748b'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {brand}
    </span>
  )
}

function PickupCard({ pickup }) {
  const missed = pickup.pickup_date && pickup.pickup_date < todayStr() && pickup.pickup_status === 'requested'
  return (
    <div className={`card p-4 ${missed ? 'ring-1 ring-red-300 dark:ring-red-900' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{pickup.doctor_name}</p>
          {pickup.clinic_name && <p className="text-xs text-slate-400 truncate">{pickup.clinic_name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <BrandBadge brand={pickup.brand} />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PICKUP_STATUS_CLASSES[pickup.pickup_status] || ''}`}>
            {PICKUP_STATUS_LABELS[pickup.pickup_status] || pickup.pickup_status || '—'}
          </span>
        </div>
      </div>

      {missed && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle size={12} /> Missed? Scheduled pickup date has passed and it's still marked Requested.
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={12} className="flex-shrink-0" />
          {pickup.pickup_date || 'No date given'}{pickup.pickup_window ? ` · ${pickup.pickup_window}` : ''}
        </div>
        {pickup.case_count && (
          <div className="flex items-center gap-1.5">
            <Package size={12} className="flex-shrink-0" /> {pickup.case_count} case{pickup.case_count === 1 ? '' : 's'}
          </div>
        )}
        {pickup.pickup_address && (
          <div className="flex items-center gap-1.5 col-span-2">
            <MapPin size={12} className="flex-shrink-0" /> {pickup.pickup_address}
          </div>
        )}
        {pickup.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="flex-shrink-0" /> {pickup.phone}
          </div>
        )}
        {pickup.email && (
          <div className="flex items-center gap-1.5 truncate">
            <Mail size={12} className="flex-shrink-0" /> {pickup.email}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CasePickupSchedule() {
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [selectedDate, setSelectedDate] = useState(null)

  const fetchPickups = async () => {
    setLoading(true)
    try {
      setPickups(await api.get('/api/leads/pickups'))
    } catch {
      setPickups([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchPickups() }, [])

  // date string ('YYYY-MM-DD') -> pickups on that date
  const byDate = useMemo(() => {
    const map = {}
    for (const p of pickups) {
      if (!p.pickup_date) continue
      ;(map[p.pickup_date] ||= []).push(p)
    }
    return map
  }, [pickups])

  // A day is flagged as a possible conflict when 2+ pickups share the same
  // (non-empty) window on the same date — the "blocker" the timeframe needs.
  const conflictDates = useMemo(() => {
    const set = new Set()
    for (const [date, list] of Object.entries(byDate)) {
      const byWindow = {}
      for (const p of list) {
        if (!p.pickup_window) continue
        byWindow[p.pickup_window] = (byWindow[p.pickup_window] || 0) + 1
      }
      if (Object.values(byWindow).some((n) => n >= 2)) set.add(date)
    }
    return set
  }, [byDate])

  const prevMonth = () => setCurrent((c) => { const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })
  const nextMonth = () => setCurrent((c) => { const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })
  const goToday = () => { const d = new Date(); setCurrent({ year: d.getFullYear(), month: d.getMonth() }); setSelectedDate(todayStr()) }

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay()
  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const dateStr = (day) => `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const today = todayStr()

  const visiblePickups = selectedDate ? (byDate[selectedDate] || []) : pickups
  const sortedVisible = [...visiblePickups].sort((a, b) => (a.pickup_date || '9999').localeCompare(b.pickup_date || '9999'))

  return (
    <div className="px-4 py-5 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="page-title">Case Pickup Schedules</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {pickups.length} scheduled pickup{pickups.length === 1 ? '' : 's'} from the website pickup form
          </p>
        </div>
        <button onClick={fetchPickups} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4"><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Calendar */}
          <div data-tour="pickup-calendar" className="lg:col-span-3 card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{MONTHS[current.month]} {current.year}</h2>
                <button onClick={goToday} className="text-xs font-semibold text-[#06babe] hover:underline">Today</button>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square border-b border-r border-slate-50 dark:border-slate-800/60" />
                const ds = dateStr(day)
                const dayPickups = byDate[ds] || []
                const isToday = ds === today
                const isSelected = ds === selectedDate
                const hasConflict = conflictDates.has(ds)
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={`aspect-square border-b border-r border-slate-50 dark:border-slate-800/60 p-1.5 flex flex-col items-center justify-start gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-[#06babe]/10 dark:bg-teal-400/10' : ''
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isToday ? 'bg-[#06babe] text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}>{day}</span>
                    {dayPickups.length > 0 && (
                      <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full ${
                        hasConflict ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-[#06babe]/10 text-[#06babe]'
                      }`}>
                        {hasConflict && <AlertTriangle size={8} />}
                        {dayPickups.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {selectedDate ? `Pickups — ${selectedDate}` : 'All Scheduled Pickups'}
              </p>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-xs font-semibold text-[#06babe] hover:underline flex items-center gap-1">
                  <X size={11} /> Clear
                </button>
              )}
            </div>
            <div data-tour="pickup-list" className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {sortedVisible.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No pickups" description={selectedDate ? 'Nothing scheduled this day.' : 'No pickup requests yet.'} size="sm" />
              ) : (
                sortedVisible.map((p) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                    <PickupCard pickup={p} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
