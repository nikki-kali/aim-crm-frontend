import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, MotionConfig, AnimatePresence } from 'framer-motion'
import { Target } from 'lucide-react'
import api from '../lib/api'
import EmptyState from '../components/EmptyState'
import GoalBar from '../components/progress/GoalBar'
import { prefersReducedMotion } from '../hooks/useCountUp'

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const count = (n) => String(Math.round(n))
const INTRO_MS = 1200

// A brief title-card "reveal" before the real content shows, so opening
// the page feels more like a showcase than a plain data load - skipped
// entirely under reduced motion (see prefersReducedMotion below).
function IntroCard({ repName, monthLabel }) {
  return (
    <motion.div
      key="intro"
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="min-h-[60vh] flex items-center justify-center rounded-2xl text-center px-6"
      style={{ background: 'linear-gradient(135deg,#06babe,#207290)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">{monthLabel} Progress</p>
        <h1 className="text-white text-3xl font-bold">{repName}</h1>
      </motion.div>
    </motion.div>
  )
}

export default function ProgressStatus() {
  const [searchParams] = useSearchParams()
  const repId = searchParams.get('rep')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState(prefersReducedMotion() ? 'content' : 'intro')

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPhase(prefersReducedMotion() ? 'content' : 'intro')
    const path = repId ? `/api/reports/rep-progress?rep_id=${encodeURIComponent(repId)}` : '/api/reports/rep-progress'
    api.get(path)
      .then(setData)
      .catch((err) => setError(
        err.status === 403 ? "You don't have access to this rep's progress" : 'Could not load progress right now'
      ))
      .finally(() => setLoading(false))
  }, [repId])

  useEffect(() => {
    if (phase !== 'intro') return undefined
    const t = setTimeout(() => setPhase('content'), INTRO_MS)
    return () => clearTimeout(t)
  }, [phase])

  if (loading) {
    return (
      <div className="px-4 py-5 sm:p-6 max-w-3xl mx-auto">
        <div className="card p-5 animate-pulse h-40" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-5 sm:p-6 max-w-3xl mx-auto">
        <EmptyState icon={Target} title="Can't show this page" description={error} />
      </div>
    )
  }

  const octoberMonth = data.months.find((m) => m.month === 'October')

  return (
    // reducedMotion="user" makes every motion.* below skip straight to
    // its animate state (no fade/slide) when the viewer's browser has
    // "reduce motion" on - GoalBar/useCountUp already handled this for
    // the bars themselves, but these entrance animations didn't (review
    // finding, 2026-09-29). The intro phase itself is skipped entirely
    // under reduced motion (see the phase useState above).
    <MotionConfig reducedMotion="user">
    <div className="px-4 py-5 sm:p-6 max-w-3xl mx-auto">
    <AnimatePresence mode="wait">
    {phase === 'intro' ? (
      <IntroCard key="intro" repName={data.repName} monthLabel={octoberMonth ? octoberMonth.month : data.quarter} />
    ) : (
    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="page-title">{data.repName}&apos;s {data.quarter} Progress</h1>
        {data.coachMessage && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data.coachMessage}</p>
        )}
      </motion.div>

      {data.suggestedSteps.length > 0 && (
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Suggested next steps</p>
          <ul className="space-y-1.5">
            {data.suggestedSteps.map((step) => (
              <li key={step} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2">
                <span className="text-[#06babe]">&bull;</span>{step}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4">
        {octoberMonth && (
          <motion.div
            key={octoberMonth.month}
            className="card p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{octoberMonth.month}</p>
            <GoalBar label="Sales" goal={octoberMonth.salesGoal} format={money} />
            <GoalBar label="New Doctors" goal={octoberMonth.doctorsGoal} format={count} />
          </motion.div>
        )}
      </div>
    </motion.div>
    )}
    </AnimatePresence>
    </div>
    </MotionConfig>
  )
}
