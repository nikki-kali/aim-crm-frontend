import { useEffect, useState } from 'react'
import api from '../lib/api'
import { RefreshCw, DollarSign, MoreHorizontal, Check } from 'lucide-react'
import AnimatedModal from '../components/AnimatedModal'

const COLUMNS = [
  { id: 'Lead',      label: 'New Leads',     color: '#6b7280' },
  { id: 'Contacted', label: 'Contacted',      color: '#3b82f6' },
  { id: 'Proposal',  label: 'Proposal Sent',  color: '#f59e0b' },
  { id: 'Pending',   label: 'Negotiating',    color: '#8b5cf6' },
  { id: 'Won',       label: 'Closing',        color: '#06babe' },
]

// Desktop drag-and-drop (HTML5 draggable) doesn't fire on touch at all, so
// mobile gets an explicit "Move to stage" sheet per card instead.
function MoveStageSheet({ lead, onClose, onMove }) {
  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      header={
        <div className="px-5 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Move to stage</h2>
          <p className="text-xs text-slate-400 truncate mt-0.5">{lead.doctor_name}</p>
        </div>
      }
    >
      <div className="px-3 py-2">
        {COLUMNS.map(col => {
          const isCurrent = col.id === lead.status
          return (
            <button
              key={col.id}
              onClick={() => { onMove(lead, col.id); onClose() }}
              disabled={isCurrent}
              className={`w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium transition-colors ${
                isCurrent
                  ? 'text-slate-400 dark:text-slate-600'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
              <span className="flex-1 text-left">{col.label}</span>
              {isCurrent && <Check size={15} className="text-[#06babe] flex-shrink-0" />}
            </button>
          )
        })}
      </div>
    </AnimatedModal>
  )
}

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [moveLeadId, setMoveLeadId] = useState(null)

  const fetchLeads = async () => {
    setLoading(true)
    const data = await api.get('/api/leads').catch(() => [])
    setLeads((data || []).filter(l => l.status !== 'Lost'))
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const moveLeadToStage = async (lead, status) => {
    if (lead.status === status) return
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status } : l))
    await api.put(`/api/leads/${lead.id}`, { ...lead, status }).catch(console.error)
  }

  const handleDrop = async (e, colId) => {
    e.preventDefault()
    if (!dragging || dragging.status === colId) {
      setDragging(null)
      setDragOver(null)
      return
    }
    const lead = dragging
    setDragging(null)
    setDragOver(null)
    moveLeadToStage(lead, colId)
  }

  const totalValue = leads.reduce((s, l) => s + Number(l.estimated_value || 0), 0)
  const moveLead = moveLeadId ? leads.find(l => l.id === moveLeadId) : null

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center text-gray-400">
        <RefreshCw className="mx-auto mb-2 animate-spin" size={24} />
        <p className="text-sm">Loading pipeline...</p>
      </div>
    </div>
  )

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p data-tour="pipeline-value" className="text-sm text-gray-500 mt-0.5">
            {leads.length} active leads · ${totalValue.toLocaleString()} pipeline value
          </p>
        </div>
        <button onClick={fetchLeads} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div data-tour="pipeline-board" className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ minHeight: 520 }}>
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id)
          const colVal = colLeads.reduce((s, l) => s + Number(l.estimated_value || 0), 0)
          const isOver = dragOver === col.id

          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-60 flex flex-col rounded-xl transition-all duration-150 ${
                isOver ? 'ring-2 ring-[#06babe]/30 bg-[#06babe]/5' : 'bg-gray-100/70 dark:bg-slate-800/70'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-xs bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
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
                    className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none ${
                      dragging?.id === lead.id ? 'opacity-40 ring-2 ring-[#06babe]/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-tight truncate">{lead.doctor_name}</p>
                        {lead.clinic_name && <p className="text-xs text-gray-400 truncate">{lead.clinic_name}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={lead.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}>
                          {lead.brand === 'Aim Dental' ? 'Aim' : 'KH'}
                        </span>
                        {/* Mobile-only: drag doesn't work on touch, so tap opens a move-to-stage sheet */}
                        <button
                          onClick={() => setMoveLeadId(lead.id)}
                          className="md:hidden tap w-7 h-7 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg -mr-1"
                          title="Move to stage"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    {lead.case_interest && <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{lead.case_interest}</p>}

                    {lead.estimated_value > 0 && (
                      <div className="flex items-center gap-0.5 text-xs font-semibold text-[#207290] dark:text-teal-400">
                        <DollarSign size={11} />
                        {Number(lead.estimated_value).toLocaleString()}
                      </div>
                    )}

                    {lead.ai_score != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                    isOver ? 'border-[#06babe]/40 bg-[#06babe]/5' : 'border-gray-200 dark:border-slate-700'
                  }`} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {moveLead && (
        <MoveStageSheet
          lead={moveLead}
          onClose={() => setMoveLeadId(null)}
          onMove={moveLeadToStage}
        />
      )}
    </div>
  )
}
