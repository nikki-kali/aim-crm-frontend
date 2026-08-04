import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Play, Check, ChevronDown, ChevronRight, Target,
  ListChecks, Lightbulb, HelpCircle, Shield,
} from 'lucide-react'
import { useTour } from '../context/TourContext'
import { TOUR_MODULES } from '../lib/tourSteps'
import { TRAINING_MODULES } from '../lib/trainingScenarios'

function SelfCheck({ check }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 mt-3">
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 leading-relaxed">{check.q}</p>
      </div>
      {revealed ? (
        <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed pl-6">{check.a}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="ml-6 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Reveal answer
        </button>
      )}
    </div>
  )
}

function ScenarioCard({ scenario, complete, onToggleComplete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <span
          onClick={(e) => { e.stopPropagation(); onToggleComplete() }}
          className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            complete
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
          }`}
        >
          {complete && <Check size={12} className="text-white" strokeWidth={3} />}
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{scenario.title}</span>
        {open ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 bg-white dark:bg-slate-900">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Situation</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{scenario.situation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                  <Target size={11} />Goal
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{scenario.goal}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                  <ListChecks size={11} />What to do
                </p>
                <ol className="space-y-1.5">
                  {scenario.steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#06babe]/10 text-[#06babe] text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Lightbulb size={11} />Why this matters
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{scenario.why}</p>
              </div>
              {scenario.check && <SelfCheck check={scenario.check} />}
              <button
                onClick={onToggleComplete}
                className={`text-xs font-semibold flex items-center gap-1.5 ${complete ? 'text-emerald-600' : 'text-[#06babe] hover:underline'}`}
              >
                <Check size={13} /> {complete ? 'Marked complete' : 'Mark as complete'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModuleSection({ mod, tour, hasTourModule }) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          {mod.label}
          {mod.adminOnly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#06babe]/10 text-[#06babe] border border-[#06babe]/20 px-2 py-0.5 rounded-full">
              <Shield size={9} />Admin
            </span>
          )}
        </h3>
        {hasTourModule && (
          <button
            onClick={() => tour.startTour(mod.id)}
            className="text-xs font-semibold text-[#06babe] hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <Play size={11} /> Take the tour
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        {mod.scenarios.map((sc) => (
          <ScenarioCard
            key={sc.id}
            scenario={sc}
            complete={tour.isComplete('scenario', sc.id)}
            onToggleComplete={() => tour.markComplete('scenario', sc.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default function TrainingPanel({ isAdmin }) {
  const tour = useTour()
  const navigate = useNavigate()
  const visibleModules = TRAINING_MODULES.filter((m) => !m.adminOnly || isAdmin)
  const tourModuleIds = new Set(TOUR_MODULES.map((m) => m.id))

  const totalScenarios = visibleModules.reduce((sum, m) => sum + m.scenarios.length, 0)
  const completedScenarios = visibleModules.reduce(
    (sum, m) => sum + m.scenarios.filter((sc) => tour.isComplete('scenario', sc.id)).length,
    0
  )

  const fullTourModules = TOUR_MODULES.filter((m) => !m.adminOnly || isAdmin)
  const completedTours = fullTourModules.filter((m) => tour.isComplete('tour', m.id)).length

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#06babe]/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={20} className="text-[#06babe]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Training</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Real scenarios for every part of the CRM — not just where things are, but why they're built the way they are.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => { tour.startFullTour(); navigate('/dashboard') }}
          className="btn-primary flex-1 justify-center flex items-center gap-2"
        >
          <Play size={15} /> Take the Full Tour
        </button>
        <div className="flex-1 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-around text-center">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{completedTours}/{fullTourModules.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tours done</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{completedScenarios}/{totalScenarios}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Scenarios done</p>
          </div>
        </div>
      </div>

      {visibleModules.map((mod) => (
        <ModuleSection key={mod.id} mod={mod} tour={tour} hasTourModule={tourModuleIds.has(mod.id)} />
      ))}
    </div>
  )
}
