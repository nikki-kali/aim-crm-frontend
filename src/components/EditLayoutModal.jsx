// Frontend/src/components/EditLayoutModal.jsx
import { useState } from 'react'
import { X, GripVertical, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import AnimatedModal from './AnimatedModal'

// Shared show/hide + reorder editor for a dashboard's widget layout — used
// by both the Rep Dashboard and the admin Command Center. Up/down buttons
// are the primary reorder mechanism since they work on touch; each row is
// also `draggable` as a desktop bonus, matching the same native HTML5
// drag-and-drop Pipeline.jsx already uses elsewhere in this app (which has
// the same documented touch limitation).
export default function EditLayoutModal({ registry, order, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState(order)
  const [dragId, setDragId] = useState(null)
  const labelFor = id => registry.find(w => w.id === id)?.label || id

  const move = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= draft.length) return
    const next = [...draft]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft(next)
  }

  const toggle = (id) => {
    setDraft(draft.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  const onDrop = (index) => {
    if (dragId === null) return
    const from = draft.findIndex(w => w.id === dragId)
    if (from === -1 || from === index) { setDragId(null); return }
    const next = [...draft]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    setDraft(next)
    setDragId(null)
  }

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Edit Layout</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={() => onReset()} className="text-slate-500 hover:underline text-sm font-medium flex items-center gap-1.5 mr-auto">
            <RotateCcw size={13} /> Reset to Default
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn-primary">Save</button>
        </div>
      }
    >
      <div className="p-6">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Check to show a widget. Drag on desktop, or use the arrows, to reorder.
        </p>
        <div className="space-y-1.5">
          {draft.map((w, i) => (
            <div
              key={w.id}
              draggable
              onDragStart={() => setDragId(w.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
            >
              <GripVertical size={14} className="text-slate-300 dark:text-slate-600 cursor-grab flex-shrink-0 hidden sm:block" />
              <input type="checkbox" checked={w.visible} onChange={() => toggle(w.id)} className="flex-shrink-0" />
              <span className={`flex-1 text-sm ${w.visible ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                {labelFor(w.id)}
              </span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 p-0.5">
                <ChevronUp size={15} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === draft.length - 1} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 p-0.5">
                <ChevronDown size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AnimatedModal>
  )
}
