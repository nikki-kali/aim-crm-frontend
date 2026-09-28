import { useEffect, useState } from 'react'
import { useCountUp, prefersReducedMotion } from '../../hooks/useCountUp'

// One animated progress bar tied to a real goal. `goal` is a
// computeProgress()-shaped object from the backend
// ({ current_value, target, progress_pct }), or null when no target has
// been entered yet for this rep/month/metric - rendered as "Target not
// set yet" rather than a fabricated $0-of-$0 bar.
export default function GoalBar({ label, goal, format = (n) => String(Math.round(n)) }) {
  const current = useCountUp(goal ? Number(goal.current_value) : 0)
  const [widthPct, setWidthPct] = useState(() => (goal && prefersReducedMotion() ? goal.progress_pct : 0))

  useEffect(() => {
    if (!goal) return undefined
    if (prefersReducedMotion()) {
      setWidthPct(goal.progress_pct)
      return undefined
    }
    // One frame of delay so the browser paints the 0%-width bar first,
    // which is what makes the CSS `transition` below actually animate
    // instead of jumping straight to the final width.
    const id = requestAnimationFrame(() => setWidthPct(goal.progress_pct))
    return () => cancelAnimationFrame(id)
  }, [goal])

  if (!goal) {
    return (
      <div className="mb-4 last:mb-0">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xs text-slate-400 mt-1">Target not set yet</p>
      </div>
    )
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400">of {format(Number(goal.target))} goal</p>
      </div>
      <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{format(current)}</p>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#06babe] to-[#207290] transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, widthPct)}%` }}
        />
      </div>
    </div>
  )
}
