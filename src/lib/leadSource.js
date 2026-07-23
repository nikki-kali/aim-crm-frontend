// Canonical list of lead-source options shown in dropdowns across the app.
export const LEAD_SOURCES = [
  'Website Form Submission', 'Referral', 'Google', 'LinkedIn', 'Facebook',
  'Instagram', 'X', 'Email Marketing', 'Email', 'Office Visit', 'Walk-in', 'Other',
]

// Leads can arrive with a source tagged by external systems we don't control
// (Zapier/Make webhooks from social lead-gen forms — see social-lead-setup.md
// — send lowercase values like "linkedin"/"twitter"/"office visit"). This
// normalizes any of those raw values to the matching canonical label above
// so the same source always displays/groups the same way regardless of who
// wrote it.
const ALIASES = {
  'website': 'Website Form Submission',
  'web': 'Website Form Submission',
  'referral': 'Referral',
  'google': 'Google',
  'linkedin': 'LinkedIn',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'twitter': 'X',
  'x (twitter)': 'X',
  'email marketing': 'Email Marketing',
  'email': 'Email',
  'office visit': 'Office Visit',
  'walk-in': 'Walk-in',
  'walk in': 'Walk-in',
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

// Returns a canonical display label for a raw lead_source/referral_source
// value, or null if there's nothing to show.
export function normalizeSource(raw) {
  const val = (raw || '').trim()
  if (!val) return null
  return ALIASES[val.toLowerCase()] || titleCase(val)
}
