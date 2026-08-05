// Sales Rep and Staff get identical page/data access (scoped to their own
// records); the only difference is Sales Rep gets notified about their own
// leads (cold leads, lost-lead recovery, win streaks) and Staff doesn't.
export const ROLES = ['admin', 'sales_rep', 'staff']

export const ROLE_LABELS = {
  admin: 'Admin',
  sales_rep: 'Sales Rep',
  staff: 'Staff',
}

export const ROLE_DESCRIPTIONS = {
  admin: 'Full access, plus Reports, Automations, and Users',
  sales_rep: 'Own leads, clients, cases & pipeline — notified about their leads',
  staff: 'Own leads, clients, cases & pipeline — no lead notifications',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role
}
