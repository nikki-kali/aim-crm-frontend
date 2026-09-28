import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import api from '../lib/api'
import EmptyState from '../components/EmptyState'
import GoalBar from '../components/progress/GoalBar'

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const count = (n) => String(Math.round(n))

export default function ProgressStatus() {
  const [searchParams] = useSearchParams()
  const repId = searchParams.get('rep')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const path = repId ? `/api/reports/rep-progress?rep_id=${encodeURIComponent(repId)}` : '/api/reports/rep-progress'
    api.get(path)
      .then(setData)
      .catch((err) => setError(
        err.status === 403 ? "You don't have access to this rep's progress" : 'Could not load progress right now'
      ))
      .finally(() => setLoading(false))
  }, [repId])

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

  return (
    <div className="px-4 py-5 sm:p-6 max-w-3xl mx-auto space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-3">
        {data.months.map((m, i) => (
          <motion.div
            key={m.month}
            className="card p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{m.month}</p>
            <GoalBar label="Sales" goal={m.salesGoal} format={money} />
            <GoalBar label="New Doctors" goal={m.doctorsGoal} format={count} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
