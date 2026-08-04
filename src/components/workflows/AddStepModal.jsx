import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import AnimatedModal from '../AnimatedModal'
import { NODE_CATEGORIES } from './nodeDefs'

export default function AddStepModal({ onClose, onAdd }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NODE_CATEGORIES
    return NODE_CATEGORIES
      .map((cat) => ({ ...cat, nodes: cat.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)) }))
      .filter((cat) => cat.nodes.length > 0)
  }, [search])

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="lg"
      header={
        <div className="p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Add a step</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search steps..."
              className="input pl-9"
            />
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-5 pt-2 space-y-5">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No steps match "{search}"</p>
        )}
        {filtered.map((cat) => (
          <div key={cat.key}>
            <p className="label mb-2">{cat.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {cat.nodes.map((n) => {
                const Icon = n.icon
                return (
                  <button
                    key={n.type}
                    onClick={() => onAdd(n)}
                    className="flex items-start gap-2.5 text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#06babe] hover:bg-[#06babe]/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}1A` }}>
                      <Icon size={15} style={{ color: n.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{n.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug mt-0.5">{n.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AnimatedModal>
  )
}
