import { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronRight, MoreHorizontal } from 'lucide-react'
import { STAGE_COLORS, PRIORITY_CLASSES, stepsForCase, daysUntil, nextStage } from '../../lib/cases'

export default function CaseCard({ caseRow: c, onStepClick, onOpenSheet, onAdvance }) {
  const [armed, setArmed] = useState(false)
  const armTimer = useRef(null)

  useEffect(() => () => clearTimeout(armTimer.current), [])

  const days = daysUntil(c.due_date)
  const dueSoon = days !== null && days >= 0 && days <= 2 && c.status !== 'Completed'
  const overdue = days !== null && days < 0 && c.status !== 'Completed'
  const next = nextStage(c.status)

  const handleAdvanceClick = () => {
    if (!armed) {
      setArmed(true)
      armTimer.current = setTimeout(() => setArmed(false), 3000)
      return
    }
    clearTimeout(armTimer.current)
    setArmed(false)
    onAdvance(c.id, next)
  }

  return (
    <div className={`card p-3.5 border-l-4 ${
      overdue ? 'border-l-red-400 bg-red-50/40 dark:bg-red-950/10' :
      dueSoon ? 'border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10' :
      'border-l-transparent'
    }`}>
      {/* Meta row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">{c.case_number}</span>
          <span className={c.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
            {c.brand === 'Aim Dental' ? 'Aim' : 'KH'}
          </span>
          {c.priority !== 'Normal' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_CLASSES[c.priority] || ''}`}>
              {c.priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 text-xs whitespace-nowrap">
          <Calendar size={12} className={overdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-slate-400'} />
          <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-medium' : 'text-slate-500 dark:text-slate-400'}>
            {c.due_date ? new Date(c.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </span>
          {overdue && <span className="text-red-600 font-medium">· overdue</span>}
          {dueSoon && <span className="text-amber-600 font-medium">· {days === 0 ? 'today' : `${days}d`}</span>}
        </div>
      </div>

      {/* Client / patient / value */}
      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">{c.client_name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2.5">
        {c.patient || '—'} · {c.case_type}{c.value ? ` · $${Number(c.value).toLocaleString()}` : ''}
      </p>

      {/* Stage — tap opens the progress sheet, never a native <select> here:
          an iOS wheel-picker can commit a value on a scroll-past, and a
          stage change emails the doctor. */}
      <button
        onClick={() => onOpenSheet(c.id)}
        className="w-full flex items-center justify-between gap-2 mb-2.5 min-h-[40px] px-1 -mx-1 rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
      >
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[c.status] || ''}`}>{c.status}</span>
        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
      </button>

      {/* Production checkpoints — enlarged tap targets, kept inline (not
          hidden in a sheet): this is bench staff's highest-frequency action
          and the whole point is at-a-glance state. */}
      <div className="flex items-center gap-2 mb-3">
        {stepsForCase(c).map(step => {
          const done = !!c[step.atField]
          return (
            <button
              key={step.key}
              onClick={() => onStepClick(c, step)}
              title={step.label}
              className={`w-11 h-11 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
                done
                  ? 'bg-[#06babe] text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-700'
              }`}
            >
              {step.badge}
            </button>
          )
        })}
      </div>

      {/* Quick actions */}
      {next ? (
        <div className="flex gap-2">
          <button
            onClick={handleAdvanceClick}
            className={`flex-1 tap text-xs font-semibold rounded-xl transition-all ${
              armed
                ? 'bg-[#06babe] text-white ring-2 ring-[#06babe]/40'
                : 'bg-[#06babe]/10 text-[#06babe] dark:bg-teal-400/10 dark:text-teal-400'
            }`}
          >
            {armed ? `Confirm → ${next}` : `Advance to ${next}`}
          </button>
          <button
            onClick={() => onOpenSheet(c.id)}
            title="More actions"
            className="tap w-11 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onOpenSheet(c.id)}
          className="w-full tap text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          View details
        </button>
      )}
    </div>
  )
}
