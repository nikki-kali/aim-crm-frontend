import { UserCheck, Pencil, Archive, ArchiveRestore, Trash2, Truck, PackageCheck, X } from 'lucide-react'
import AnimatedModal from '../AnimatedModal'

export default function LeadActionsSheet({
  lead, isAdmin, currentUserId, reps, viewTab, showArchived, converting,
  onClose, onAssign, onClaim, onDispatch, onReceived, onConvert, onEdit, onArchive, onDelete,
}) {
  const canEdit = isAdmin || !lead.assigned_to || lead.assigned_to === currentUserId

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{lead.doctor_name}</h2>
            <p className="text-xs text-slate-400 truncate mt-0.5">{lead.clinic_name || 'No clinic'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex-shrink-0"><X size={16} /></button>
        </div>
      }
    >
      <div className="px-3 py-2 space-y-0.5">
        {viewTab === 'unassigned' ? (
          <button
            onClick={() => { onClaim(lead); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-[#06babe] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <UserCheck size={16} /> Claim this lead
          </button>
        ) : (
          <div className="px-3 py-2">
            <label className="label">Assign to</label>
            <select
              className="input"
              value={lead.assigned_to || ''}
              onChange={e => { onAssign(lead, e.target.value || null); onClose() }}
            >
              <option value="">— None —</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name || r.email}</option>)}
            </select>
          </div>
        )}

        {!showArchived && lead.case_interest === 'Schedule Pickup' && lead.pickup_status === 'requested' && (
          <button
            onClick={() => { onDispatch(lead); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Truck size={16} /> Mark Dispatched
          </button>
        )}
        {!showArchived && lead.case_interest === 'Schedule Pickup' && lead.pickup_status === 'dispatched' && (
          <button
            onClick={() => { onReceived(lead); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <PackageCheck size={16} /> Mark Received
          </button>
        )}
        {lead.status === 'Won' && !lead.converted_to_client_id && !showArchived && (
          <button
            onClick={() => { onConvert(lead); onClose() }}
            disabled={converting}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <UserCheck size={16} /> Convert to Client
          </button>
        )}
        {lead.converted_to_client_id && (
          <p className="px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5"><UserCheck size={12} /> Already converted to client</p>
        )}
        {canEdit && (
          <button
            onClick={() => { onEdit(lead); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil size={16} /> Edit lead
          </button>
        )}
        <button
          onClick={() => { onArchive(lead); onClose() }}
          className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {showArchived ? 'Restore lead' : 'Archive lead'}
        </button>
        {isAdmin && (
          <button
            onClick={() => { onDelete(lead.id); onClose() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 size={16} /> Delete lead
          </button>
        )}
      </div>
    </AnimatedModal>
  )
}
