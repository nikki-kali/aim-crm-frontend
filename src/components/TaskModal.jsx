import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useToast } from './Toast'
import AnimatedModal from './AnimatedModal'
import ClientPicker from './ClientPicker'

const PRIORITIES = [
  { id: 'low', label: 'Low', cls: 'text-slate-500 border-slate-200 dark:border-slate-700' },
  { id: 'normal', label: 'Normal', cls: 'text-[#057a7e] border-[#057a7e]/30' },
  { id: 'high', label: 'High', cls: 'text-red-600 border-red-200 dark:border-red-900' },
]

// Shared create/edit dialog for tasks — used by My Tasks, the Clients page
// Tasks tab, and the admin-dashboard "Create Task" flow, so the same rich
// field set (due date, priority, notes, client, assignee) only has to be
// built once. `task` null means create; passing an existing task means edit.
// `canAssign` shows the rep picker (admins only — everyone else can only
// ever be creating/editing their own tasks, so it stays implicit).
export default function TaskModal({ task, clients, reps, canAssign, currentUserId, defaultClientId, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: task?.title || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'normal',
    notes: task?.notes || '',
    client_id: task?.entity_type === 'client' ? task.entity_id : (defaultClientId || ''),
    assigned_to: task?.assigned_to || (canAssign ? '' : currentUserId),
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Defaults the assignee to whichever rep already owns the picked client —
  // the common case — admins can still override it before saving. Mirrors
  // the same default the Clients page Tasks tab already used.
  const onClientChange = id => {
    set('client_id', id)
    if (canAssign && !task) {
      const client = clients.find(c => c.id === id)
      if (client?.assigned_to) set('assigned_to', client.assigned_to)
    }
  }

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        entity_type: form.client_id ? 'client' : null,
        entity_id: form.client_id || null,
        title: form.title.trim(),
        due_date: form.due_date || null,
        priority: form.priority,
        notes: form.notes,
        assigned_to: form.assigned_to || null,
      }
      if (task) {
        await api.put(`/api/tasks/${task.id}`, { ...payload, completed: task.completed })
        toast('Task updated', 'success')
      } else {
        await api.post('/api/tasks', payload)
        toast('Task added', 'success')
      }
      onSaved()
      onClose()
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const remove = async () => {
    if (!confirm('Delete this task?')) return
    setSaving(true)
    try {
      await api.delete(`/api/tasks/${task.id}`)
      toast('Task deleted', 'success')
      onSaved()
      onClose()
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="md"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          {task && (
            <button onClick={remove} disabled={saving} className="text-red-600 hover:underline text-sm font-medium flex items-center gap-1.5 mr-auto disabled:opacity-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()} className="btn-primary disabled:opacity-50">
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Task title..."
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="flex gap-1.5">
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set('priority', p.id)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${
                    form.priority === p.id ? `${p.cls} bg-current/5` : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Client</label>
          <ClientPicker clients={clients} value={form.client_id} onChange={onClientChange} />
        </div>

        {canAssign && (
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">Unassigned</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any relevant details..."
          />
        </div>
      </div>
    </AnimatedModal>
  )
}
