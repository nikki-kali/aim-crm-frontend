import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { OFFICE_VISIT_CATEGORIES } from '../../lib/officeVisitCategories'

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  time_suggested: 'Time suggested',
  declined: 'Declined',
}

function fmtDateTime(date, time) {
  if (!date) return 'TBD'
  const d = new Date(`${date}T${time || '00:00:00'}`)
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function OfficeVisits() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewForm, setShowNewForm] = useState(false)
  const [rescheduling, setRescheduling] = useState(null) // booking id being rescheduled

  async function load() {
    setLoading(true)
    try {
      const data = await api.get('/api/office-visits-admin')
      setBookings(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function approve(booking) {
    await fetch(`${import.meta.env.VITE_API_URL}/api/office-visits/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: booking.approve_token }),
    })
    load()
  }

  async function suggestTime(booking) {
    await fetch(`${import.meta.env.VITE_API_URL}/api/office-visits/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: booking.suggest_time_token }),
    })
    load()
  }

  async function submitReschedule(id, confirmed_date, confirmed_time) {
    await api.put(`/api/office-visits-admin/${id}/reschedule`, { confirmed_date, confirmed_time })
    setRescheduling(null)
    load()
  }

  const visible = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Office Visits</h1>
        <button onClick={() => setShowNewForm(true)} className="px-4 py-2 rounded-full bg-ink text-white font-semibold">New Office Visit</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'time_suggested', 'approved'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusFilter === s ? 'bg-teal text-white' : 'bg-white border border-hairline text-slate'}`}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate">Loading…</p> : (
        <div className="space-y-3">
          {visible.length === 0 && <p className="text-slate">No office visits here yet.</p>}
          {visible.map((b) => (
            <div key={b.id} className="p-4 rounded-xl border border-hairline bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-ink">{b.practice_name || b.contact_name}</p>
                  <p className="text-sm text-slate">{b.contact_name}{b.contact_role ? ` — ${b.contact_role}` : ''}</p>
                  <p className="text-sm text-slate">{fmtDateTime(b.confirmed_date || b.requested_date, b.confirmed_time || b.requested_time)}</p>
                  <p className="text-xs text-faint mt-1">{b.assigned_rep_name || 'Unassigned'} · {STATUS_LABEL[b.status]}</p>
                </div>
                <div className="flex gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => approve(b)} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-semibold">Approve</button>
                      <button onClick={() => suggestTime(b)} className="px-3 py-1.5 rounded-full border border-hairline text-sm font-semibold">Suggest another time</button>
                    </>
                  )}
                  {b.status === 'time_suggested' && (
                    rescheduling === b.id ? (
                      <RescheduleForm onSubmit={(date, time) => submitReschedule(b.id, date, time)} onCancel={() => setRescheduling(null)} />
                    ) : (
                      <button onClick={() => setRescheduling(b.id)} className="px-3 py-1.5 rounded-full bg-ink text-white text-sm font-semibold">Set confirmed time</button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewForm && <NewOfficeVisitModal onClose={() => setShowNewForm(false)} onCreated={() => { setShowNewForm(false); load() }} />}
    </div>
  )
}

function RescheduleForm({ onSubmit, onCancel }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  return (
    <div className="flex gap-2 items-center">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-hairline rounded-lg px-2 py-1 text-sm" />
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-hairline rounded-lg px-2 py-1 text-sm" />
      <button onClick={() => date && time && onSubmit(date, time)} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-semibold">Confirm</button>
      <button onClick={onCancel} className="text-sm text-slate">Cancel</button>
    </div>
  )
}

function NewOfficeVisitModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    practice_name: '', contact_name: '', contact_role: '', address_line1: '', city: '', state: '', zip: '',
    email: '', phone: '', message: '', service_interests: [], requested_date: '', requested_time: '',
  })
  const [saving, setSaving] = useState(false)

  function toggleInterest(cat) {
    setForm((f) => ({
      ...f,
      service_interests: f.service_interests.includes(cat)
        ? f.service_interests.filter((c) => c !== cat)
        : [...f.service_interests, cat],
    }))
  }

  async function submit() {
    if (!form.contact_name || !form.phone || !form.requested_date || !form.requested_time) return
    setSaving(true)
    try {
      await api.post('/api/office-visits-admin', form)
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-ink mb-4">New Office Visit</h2>
        <div className="space-y-3">
          <input placeholder="Practice name" value={form.practice_name} onChange={(e) => setForm({ ...form, practice_name: e.target.value })} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Contact name *" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input type="date" value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm" />
            <input type="time" value={form.requested_time} onChange={(e) => setForm({ ...form, requested_time: e.target.value })} className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate mb-2">Interested in</p>
            <div className="flex flex-wrap gap-2">
              {OFFICE_VISIT_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleInterest(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${form.service_interests.includes(cat) ? 'bg-teal text-white border-teal' : 'border-hairline text-slate'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <textarea placeholder="Notes (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm min-h-[4rem]" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}
