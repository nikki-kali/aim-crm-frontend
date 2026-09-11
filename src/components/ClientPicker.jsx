import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

// Type-to-filter client picker — a plain <select> gets unwieldy to scroll
// once a rep has more than a handful of clients. Shared by TaskModal (task
// creation/editing) and the My Tasks page's own task form.
export default function ClientPicker({ clients, value, onChange, placeholder = 'No client' }) {
  const selected = clients.find(c => c.id === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    const onClickOutside = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const matches = query.trim()
    ? clients.filter(c => c.doctor_name.toLowerCase().includes(query.trim().toLowerCase()))
    : clients

  const pick = c => {
    onChange(c?.id || '')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative flex-1">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="input text-sm py-1.5 pl-7 pr-7"
          placeholder={placeholder}
          value={open ? query : (selected?.doctor_name || '')}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        />
        {selected && !open && (
          <button
            type="button"
            onClick={() => pick(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title="Clear client"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            No client
          </button>
          {matches.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-slate-400">No matching clients</p>
          )}
          {matches.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 truncate"
            >
              {c.doctor_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
