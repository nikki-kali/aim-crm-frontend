import { normalizeSource } from './leadSource'

export const STATUS_OPTIONS = ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost', 'Pending']
export const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
export const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
export const INTENT_OPTIONS = ['High', 'Medium', 'Low']

export const STATUS_CLASSES = {
  Lead: 'status-lead', Contacted: 'status-contacted', Proposal: 'status-proposal',
  Won: 'status-won', Lost: 'status-lost', Pending: 'status-pending',
}

export const INTENT_CLASSES = {
  High: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Low: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400',
}

// Pickup-request lifecycle (requested → dispatched → received) — separate
// from the sales-pipeline STATUS_CLASSES above, only shown/used for leads
// where case_interest === 'Schedule Pickup'.
export const PICKUP_STATUS_LABELS = { requested: 'Requested', dispatched: 'Dispatched', received: 'Received' }
export const PICKUP_STATUS_CLASSES = {
  requested: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
}

export const EMPTY_FORM = {
  doctor_name: '', clinic_name: '', brand: 'Aim Dental', case_interest: '', phone: '',
  email: '', lead_source: '', estimated_value: '', status: 'Lead',
  intent_level: 'Medium', notes: '', assigned_to: '',
}

export const CSV_TEMPLATE = [
  'Doctor Name,Clinic Name,Brand,Case Interest,Phone,Email,Lead Source,Estimated Value,Notes',
  'Dr. Jane Smith,Smith Dental Group,Aim Dental,Implant,(718) 555-0100,dr.smith@example.com,Referral,8500,Interested in full arch implants',
].join('\n')

const SOURCE_SCORES = {
  Referral: 25, LinkedIn: 20, 'Office Visit': 20, Google: 15,
  'Website Form Submission': 15, Email: 10, 'Walk-in': 12, Facebook: 10,
  Instagram: 10, X: 8, 'Email Marketing': 8,
}
const CASE_SCORES = { Implant: 15, 'Crown & Bridge': 12, Ortho: 10, Dentures: 8, Partial: 5 }
const INTENT_SCORES = { High: 20, Medium: 10, Low: 0 }

export function scoreFromLead(lead) {
  let s = 0
  s += SOURCE_SCORES[normalizeSource(lead.lead_source || lead.referral_source)] || 0
  const val = Number(lead.estimated_value) || 0
  if (val >= 8000) s += 25
  else if (val >= 4000) s += 15
  else if (val >= 2000) s += 10
  else s += 5
  s += CASE_SCORES[lead.case_interest] || 0
  s += INTENT_SCORES[lead.intent_level] || 0
  if (lead.email) s += 5
  if (lead.phone) s += 5
  return Math.min(s, 100)
}

export function scoreColor(s) {
  if (s >= 80) return 'text-green-600 bg-green-50 dark:bg-green-950/40'
  if (s >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
  return 'text-red-500 bg-red-50 dark:bg-red-950/40'
}

function parseCsvLine(line) {
  const cells = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cells.push(cur.trim())
  return cells
}

export function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  )
  const col = (...keys) => { for (const k of keys) { const i = headers.indexOf(k); if (i >= 0) return i } return -1 }
  const map = {
    doctor_name:     col('doctor_name', 'doctor', 'name', 'contact_person', 'person_name', 'full_name', 'title'),
    first_name:      col('first_name'),
    last_name:       col('last_name'),
    clinic_name:     col('clinic_name', 'clinic', 'organization', 'company', 'org_name'),
    brand:           col('brand'),
    case_interest:   col('case_interest', 'case_type', 'case'),
    phone:           col('phone', 'phone_mobile', 'phone_work', 'phone_number'),
    email:           col('email', 'email_work', 'email_home', 'email_address'),
    lead_source:     col('lead_source', 'referral_source', 'source', 'channel'),
    estimated_value: col('estimated_value', 'value', 'deal_value', 'amount'),
    notes:           col('notes', 'note', 'description', 'comment'),
    status:          col('status', 'stage', 'deal_stage'),
  }

  const PIPEDRIVE_STATUS = { open: 'Lead', won: 'Won', lost: 'Lost', deleted: 'Lost' }

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line)
    const g = (k) => map[k] >= 0 ? (cells[map[k]] || '').trim() : ''

    let doctor_name = g('doctor_name')
    if (!doctor_name && (map.first_name >= 0 || map.last_name >= 0)) {
      doctor_name = [g('first_name'), g('last_name')].filter(Boolean).join(' ')
    }
    if (!doctor_name) return null

    const rawStatus = g('status').toLowerCase()
    const status = PIPEDRIVE_STATUS[rawStatus] || (STATUS_OPTIONS.includes(g('status')) ? g('status') : 'Lead')

    return {
      doctor_name,
      clinic_name:     g('clinic_name'),
      brand:           BRAND_OPTIONS.includes(g('brand')) ? g('brand') : 'Aim Dental',
      case_interest:   CASE_TYPES.includes(g('case_interest')) ? g('case_interest') : '',
      phone:           g('phone'),
      email:           g('email'),
      lead_source:     g('lead_source'),
      estimated_value: g('estimated_value'),
      notes:           g('notes'),
      status,
      intent_level:    'Medium',
    }
  }).filter(Boolean)
}
