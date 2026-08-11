export const BRAND_OPTIONS = ['Aim Dental', 'Kings Highway']
export const CASE_TYPES = ['Crown & Bridge', 'Dentures', 'Implant', 'Ortho', 'Partial', 'Other']
export const PRIORITY_OPTIONS = ['Normal', 'Rush', 'STAT']

// Removable cases (Dentures/Partial) are the only ones that go through the
// plaster department + outsourcing-lab shipment leg of AIM's workflow.
export const REMOVABLE_TYPES = ['Dentures', 'Partial']

export const STAGES = [
  'Case Received', 'Awaiting Scan', 'Case Accepted',
  'In Production', 'Quality Control', 'Ready for Dispatch',
  'Dispatched', 'Completed',
]

export const STAGE_COLORS = {
  'Case Received':     'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
  'Awaiting Scan':      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  'Case Accepted':      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  'In Production':      'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  'Quality Control':    'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
  'Ready for Dispatch': 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
  'Dispatched':         'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
  'Completed':          'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
}

export const PRIORITY_CLASSES = {
  Normal: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
  Rush:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  STAT:   'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
}

export const EMPTY_FORM = {
  case_number: '', client_name: '', brand: 'Aim Dental',
  case_type: 'Crown & Bridge', patient: '', assigned_technician: '',
  tracking_number: '', due_date: '', est_completion_date: '', value: '',
  priority: 'Normal', status: 'Case Received', notes: '',
  doctor_email: '', doctor_phone: '',
  // Production detail (any case)
  product: '', tooth_numbers: '', quantity: 1, shade: '',
  special_instructions: '', evident_case_number: '',
  sterilized_by: '', sterilized_at: '', entered_by: '', entered_at: '',
  // Removable-only (Dentures/Partial): plaster dept -> delivery -> packing -> outsourcing
  plaster_checked_by: '', plaster_checked_at: '',
  delivered_by: '', delivered_at: '',
  packed_by: '', packed_at: '',
  outsourcing_return_date: '', outsourcing_tracking_number: '', shipped_to_outsourcing_at: '',
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.ceil((new Date(y, m - 1, d, 23, 59, 59) - new Date()) / 86400000)
}

// timestamptz columns (sterilized_at, entered_at, etc.) round-trip as full
// ISO strings — trim to YYYY-MM-DD for <input type="date">. No-op on
// columns that are already plain dates.
export function toDateInput(v) {
  return v ? String(v).slice(0, 10) : ''
}

export const DATE_FIELDS = [
  'due_date', 'est_completion_date', 'sterilized_at', 'entered_at',
  'plaster_checked_at', 'delivered_at', 'packed_at', 'outsourcing_return_date',
]

// The handful of people who actually do this work — see PRODUCTION_STEPS
// below and the "Assigned Technician" field. "Other" reveals free text so
// anyone not on the list can still be recorded.
export const STAFF_OPTIONS = ['Frankie', 'Cecile', 'Anjali', 'Miguel', 'Victor']

// The internal production checkpoints from AIM's real workflow — all five
// apply to every case type. Kept fully separate from the doctor-facing
// STAGES above: marking these never changes `status` and never sends a
// doctor email.
export const PRODUCTION_STEPS = [
  { key: 'sterilized',      label: 'Sterilized',              byField: 'sterilized_by',      atField: 'sterilized_at',      badge: 'S' },
  { key: 'entered',         label: 'Entered Into Evident',    byField: 'entered_by',          atField: 'entered_at',         badge: 'E' },
  { key: 'plaster_checked', label: 'Plaster Checked',         byField: 'plaster_checked_by',  atField: 'plaster_checked_at', badge: 'P' },
  { key: 'delivered',       label: 'Delivered to Shipping',   byField: 'delivered_by',        atField: 'delivered_at',       badge: 'D' },
  { key: 'packed',          label: 'Packed',                  byField: 'packed_by',           atField: 'packed_at',          badge: 'K' },
]

// Next stage in the doctor-facing pipeline, or null if already at the end.
export function nextStage(status) {
  const idx = STAGES.indexOf(status)
  if (idx === -1 || idx === STAGES.length - 1) return null
  return STAGES[idx + 1]
}
