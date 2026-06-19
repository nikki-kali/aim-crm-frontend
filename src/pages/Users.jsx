import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Plus, X, Shield, User, Trash2, Pencil } from 'lucide-react'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff' }

function UserModal({ userData, onClose, onSave }) {
  const [form, setForm] = useState(
    userData ? { name: userData.name || '', email: userData.email, password: '', role: userData.role } : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!userData?.id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required')
    if (!form.email.trim()) return setError('Email is required')
    if (!isEdit && !form.password) return setError('Password is required for new users')
    setSaving(true)
    setError('')
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), role: form.role }
      if (form.password) body.password = form.password
      if (isEdit) {
        await api.put(`/api/users/${userData.id}`, body)
      } else {
        await api.post('/api/users', body)
      }
      onSave()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@aimdentallab.com" />
          </div>
          <div>
            <label className="label">{isEdit ? 'New Password' : 'Password *'} <span className="text-gray-400 font-normal">{isEdit ? '(leave blank to keep current)' : ''}</span></label>
            <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="label">Role</label>
            <div className="flex gap-3">
              {['staff', 'admin'].map(r => (
                <label key={r} className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  form.role === r ? 'border-[#06babe] bg-[#06babe]/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => set('role', r)} className="hidden" />
                  {r === 'admin' ? <Shield size={15} className={form.role === r ? 'text-[#06babe]' : 'text-gray-400'} /> : <User size={15} className={form.role === r ? 'text-[#06babe]' : 'text-gray-400'} />}
                  <div>
                    <p className={`text-sm font-medium capitalize ${form.role === r ? 'text-[#06babe]' : 'text-gray-700'}`}>{r}</p>
                    <p className="text-xs text-gray-400">{r === 'admin' ? 'Full access' : 'Leads & cases only'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    const data = await api.get('/api/users').catch(() => [])
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) return alert('You cannot delete your own account.')
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    await api.delete(`/api/users/${id}`).catch(console.error)
    fetchUsers()
  }

  const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New User
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-3">No users found</p>
            <button onClick={() => setModal('new')} className="btn-primary">Add first user</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Name', 'Email', 'Role', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => {
                const isSelf = u.id === currentUser?.id
                return (
                  <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${isSelf ? 'bg-[#06babe]/5' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#06babe]/10 flex items-center justify-center text-[#06babe] font-bold text-xs flex-shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name || '—'}</p>
                          {isSelf && <p className="text-xs text-[#06babe]">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-[#06babe]/10 text-[#06babe]'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setModal(u)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name || u.email)}
                          disabled={isSelf}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelf ? "Can't delete yourself" : 'Delete user'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Staff</span> can access Leads, Clients, Cases, and Pipeline.{' '}
          <span className="font-semibold">Admins</span> also see Reports, Automations, and this Users page.
        </p>
      </div>

      {modal && (
        <UserModal
          userData={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUsers() }}
        />
      )}
    </div>
  )
}
