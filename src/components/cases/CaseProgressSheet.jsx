import { CheckCircle2, Circle, Pencil, Mail, Trash2, Info, X } from 'lucide-react'
import AnimatedModal from '../AnimatedModal'
import { STAGES, STAGE_COLORS, PRODUCTION_STEPS } from '../../lib/cases'

export default function CaseProgressSheet({ caseRow: c, isAdmin, onClose, onStageChange, onStepClick, onEdit, onResend, onDelete }) {
  const currentIdx = STAGES.indexOf(c.status)

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="md"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Update Progress</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{c.case_number} — {c.client_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
      }
    >
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Stage</p>
        <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>The doctor is emailed when the stage changes.</span>
        </div>
        <div className="space-y-0.5 mb-5">
          {STAGES.map((stage, i) => {
            const isCurrent = stage === c.status
            const isPast = i < currentIdx
            return (
              <button
                key={stage}
                onClick={() => { onStageChange(c.id, stage); onClose() }}
                className={`w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium transition-colors ${
                  isCurrent
                    ? STAGE_COLORS[stage]
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isCurrent
                  ? <CheckCircle2 size={17} className="flex-shrink-0" />
                  : <Circle size={17} className={`flex-shrink-0 ${isPast ? 'text-slate-300 dark:text-slate-700' : 'text-slate-200 dark:text-slate-800'}`} />}
                <span className="flex-1 text-left">{stage}</span>
              </button>
            )
          })}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Production Checklist</p>
        <div className="space-y-0.5 mb-5">
          {PRODUCTION_STEPS.map(step => {
            const done = !!c[step.atField]
            return (
              <button
                key={step.key}
                onClick={() => onStepClick(c, step)}
                className="w-full flex items-center justify-between gap-3 px-3 min-h-[48px] rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium">{step.label}</span>
                {done ? (
                  <span className="text-xs text-[#06babe] dark:text-teal-400 flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 size={14} />
                    {c[step.byField] || 'done'} · {new Date(c[step.atField]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex-shrink-0">Mark done</span>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Actions</p>
        <div className="space-y-0.5">
          <button
            onClick={() => { onEdit(c); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil size={16} /> Edit case
          </button>
          {c.doctor_email && (
            <button
              onClick={() => onResend(c)}
              className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Mail size={16} /> Resend notification
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { onDelete(c.id); onClose() }}
              className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 size={16} /> Delete case
            </button>
          )}
        </div>
      </div>
    </AnimatedModal>
  )
}
