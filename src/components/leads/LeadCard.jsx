import { Phone, Mail, MoreHorizontal, Star } from 'lucide-react'
import { STATUS_CLASSES, INTENT_CLASSES, PICKUP_STATUS_LABELS, PICKUP_STATUS_CLASSES, scoreColor } from '../../lib/leads'
import { normalizeSource } from '../../lib/leadSource'

export default function LeadCard({ lead, showArchived, onContactNow, onOpenSheet }) {
  const daysSince = lead.last_contacted_at
    ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000)
    : null
  const isCold = daysSince !== null && daysSince >= 14 && !['Won', 'Lost'].includes(lead.status)
  const source = normalizeSource(lead.lead_source || lead.referral_source)

  return (
    <div className={`card p-3.5 ${isCold ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{lead.doctor_name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{lead.clinic_name || '—'}</p>
        </div>
        <span className={`flex-shrink-0 ${lead.brand === 'Aim Dental' ? 'badge-aim' : 'badge-kh'}`}>
          {lead.brand === 'Aim Dental' ? 'Aim' : 'KH'}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
        {lead.case_interest || '—'}
        {source && ` · ${source}`}
        {lead.estimated_value ? ` · $${Number(lead.estimated_value).toLocaleString()}` : ''}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_CLASSES[lead.status] || ''}`}>{lead.status}</span>
        {lead.intent_level && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${INTENT_CLASSES[lead.intent_level] || 'bg-slate-100 text-slate-500'}`}>
            {lead.intent_level}
          </span>
        )}
        {lead.ai_score != null && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(lead.ai_score)}`}>
            <Star size={10} />{lead.ai_score}
          </span>
        )}
        {isCold && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
            {daysSince}d cold
          </span>
        )}
        {lead.case_interest === 'Schedule Pickup' && lead.pickup_status && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PICKUP_STATUS_CLASSES[lead.pickup_status] || 'bg-slate-100 text-slate-600'}`}>
            {PICKUP_STATUS_LABELS[lead.pickup_status] || lead.pickup_status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="tap w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#06babe] bg-slate-50 dark:bg-slate-800 rounded-lg flex-shrink-0">
            <Phone size={15} />
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="tap w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#06babe] bg-slate-50 dark:bg-slate-800 rounded-lg flex-shrink-0">
            <Mail size={15} />
          </a>
        )}
        {!showArchived && (
          <button
            onClick={() => onContactNow(lead)}
            className="flex-1 tap text-xs font-semibold rounded-xl bg-[#06babe]/10 text-[#06babe] dark:bg-teal-400/10 dark:text-teal-400"
          >
            Mark Contacted
          </button>
        )}
        <button
          onClick={() => onOpenSheet(lead.id)}
          className="tap w-9 h-9 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
