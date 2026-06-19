import { useEffect, useState } from 'react'
import api from '../lib/api'
import { RefreshCw, DollarSign } from 'lucide-react'

const COLUMNS = [
  { id: 'Lead',      label: 'New Leads',     color: '#6b7280' },
  { id: 'Contacted', label: 'Contacted',      color: '#3b82f6' },
  { id: 'Proposal',  label: 'Proposal Sent',  color: '#f59e0b' },
  { id: 'Pending',   label: 'Negotiating',    color: '#8b5cf6' },
  { id: 'Won',       label: 'Closing',        color: '#06babe' },
]

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const fetchLeads = async () => {
    setLoading(true)
    const data = await api.get('/api/leads').catch(() => [])
    setLeads((data || []).filter(l => l.status !== 'Lost'))
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const handleDrop = async (e, colId) => {
    e.preventDefault()
    if (!dragging || dragging.status === colId) {
      setDragging(null)
      setDragOver(null)
      return
    }
    const lead = dragging
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: colId } : l))
    setDragging(null)
    setDragOver(null)
    await api.put(`/api/leads/${lead.id}`, { ...lead, status: colId }).catch(console.error)
  }

  const totalValue = leads.reduce((s, l) => s + Number(l.estimated_value || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center text-gray-400">
        <RefreshCw className="mx-auto mb-2 animate-spin" size={24} />
        <p className="text-sm">Loading pipeline...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {leads.length} active leads · ${totalValue.toLocaleString()} pipeline value
          </p>
        </div>
        <button onClick={fetchLeads} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 520 }}>
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id)
          const colVal = colLeads.reduce((s, l) => s + Number(l.estimated_value || 0), 0)
          const isOver = dragOver === col.id

          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-60 flex flex-col rounded-xl transition-all duration-150 ${
                isOver ? 'ring-2 ring-[#06babe]/30 bg-[#06babe]/5' : 'bg-gray-100/70'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-xs bg-white text-gray-500 font-medium px-1.5 py-0.5 rounded-full border border-gray-200">
                    {colLeads.length}
                  </span>
                </div>
                {colVal > 0 && <p className="text-xs text-gray-400 pl-4">${colVal.toLocaleString()}</p>}
              </div>

              <div className="flex-1 px-2 pb-3 space-y-2">
                {colLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead)}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                    className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none ${
                      dragging?.id === lead.id ? 'opacity-40 ring-2 ring-[#06babe]/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight truncate">{lead.doctor_name}</p>
                        {lead.clinic_name && <p className="text-xs text-gray-400 truncate">{lead.clinic_name}</p>}
                      </div>
                      <span className={`flex-shrink-0 ${lead.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}`}>
                        {lead.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                      </span>
                    </div>

                    {lead.case_interest && <p className="text-xs text-gray-500 mb-2">{lead.case_interest}</p>}

                    {lead.estimated_value > 0 && (
                      <div className="flex items-center gap-0.5 text-xs font-semibold text-[#207290]">
                        <DollarSign size={11} />
                        {Number(lead.estimated_value).toLocaleString()}
                      </div>
                    )}

                    {lead.ai_score != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${lead.ai_score}%`,
                            backgroundColor: lead.ai_score >= 80 ? '#22c55e' : lead.ai_score >= 60 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span className="text-xs text-gray-400 w-5 text-right">{lead.ai_score}</span>
                      </div>
                    )}
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className={`rounded-lg border-2 border-dashed h-16 transition-colors ${
                    isOver ? 'border-[#06babe]/40 bg-[#06babe]/5' : 'border-gray-200'
                  }`} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
