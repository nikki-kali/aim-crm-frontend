import {
  Mail, Bell, Tag, RefreshCw, ClipboardList, UserPlus, GitBranch, Split, Filter, Clock,
  Pencil, Eraser, Archive, Gauge, Shuffle, UserCheck, FileText, Webhook,
} from 'lucide-react'

// Triggers reuse the CRM's existing automation-detection conditions (see
// Backend/src/services/workflowEngine.js's TRIGGER_QUERIES) rather than a
// generic event library — these are the only signals this CRM actually
// tracks today.
export const TRIGGER_DEFS = {
  new_lead_created: {
    label: 'New Lead Created',
    description: "Fires for leads that aren't yet Won or Lost.",
  },
  lead_score_changed: {
    label: 'AI Score Reaches',
    description: "Fires when a lead's AI score is at or above a threshold.",
    configField: 'min_score',
    configLabel: 'Minimum score',
    configType: 'number',
    configDefault: 70,
  },
  no_contact_days: {
    label: 'No Contact In N Days',
    description: "Fires when a lead hasn't been contacted in a set number of days.",
    configField: 'days',
    configLabel: 'Days without contact',
    configType: 'number',
    configDefault: 14,
  },
  case_status_changed: {
    label: 'Case Status Is',
    description: 'Fires while a case sits in a specific stage.',
    configField: 'status',
    configLabel: 'Stage',
    configType: 'case_status',
    configDefault: 'Case Received',
  },
  case_due_soon: {
    label: 'Case Due Soon',
    description: 'Fires when a case is due within a set number of days.',
    configField: 'days',
    configLabel: 'Days until due',
    configType: 'number',
    configDefault: 2,
  },
  pickup_received: {
    label: 'Pickup Received',
    description: 'Fires when a case pickup is marked received.',
  },
}

export const CASE_STAGES = [
  'Case Received', 'Awaiting Scan', 'Case Accepted',
  'In Production', 'Quality Control', 'Ready for Dispatch',
  'Dispatched', 'Completed',
]

// Organized under the same category names as the team's requested node
// list. Every node here is backed by a real column/table/service in this
// CRM — categories like Opportunity Management, Calls/SMS/Chat, paid
// integrations, AI writing, and raw code execution were deliberately left
// out since nothing in this app backs them yet; adding them as pickable
// steps would just be buttons that do nothing when a workflow runs.
export const NODE_CATEGORIES = [
  {
    key: 'contact',
    label: 'Contact Management',
    nodes: [
      { type: 'update_field', label: 'Update Field', icon: Pencil, color: '#0ea5e9', description: "Update a lead's phone, email, notes, or another field." },
      { type: 'add_tag', label: 'Add Tag', icon: Tag, color: '#0ea5e9', description: 'Tag the lead.' },
      { type: 'remove_tag', label: 'Remove Tag', icon: Eraser, color: '#0ea5e9', description: 'Remove a tag from the lead.' },
    ],
  },
  {
    key: 'lead',
    label: 'Lead Management',
    nodes: [
      { type: 'assign_rep', label: 'Assign Rep', icon: UserPlus, color: '#f97316', description: 'Assign the lead to a specific rep.' },
      { type: 'round_robin_assign', label: 'Round Robin Assign', icon: Shuffle, color: '#f97316', description: 'Assign to whichever rep currently has the fewest active leads.' },
      { type: 'recalculate_score', label: 'Recalculate AI Score', icon: Gauge, color: '#a855f7', description: "Re-run the lead's AI score based on its current data." },
      { type: 'convert_to_client', label: 'Convert to Client', icon: UserCheck, color: '#16a34a', description: 'Turn this lead into a client record (same as the manual Convert button).' },
      { type: 'archive_lead', label: 'Archive Lead', icon: Archive, color: '#64748b', description: 'Archive the lead.' },
    ],
  },
  {
    key: 'pipeline',
    label: 'Pipeline Management',
    nodes: [
      { type: 'update_status', label: 'Move Stage / Update Status', icon: RefreshCw, color: '#16a34a', description: 'Change the lead status or case stage.' },
    ],
  },
  {
    key: 'sales_activities',
    label: 'Sales Activities',
    nodes: [
      { type: 'create_note', label: 'Create Note', icon: FileText, color: '#8b5cf6', description: "Log a note on the lead's or case's activity history." },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    nodes: [
      { type: 'send_email', label: 'Send Email', icon: Mail, color: '#06babe', description: 'Email the lead, or the assigned rep.' },
      { type: 'notify_rep', label: 'Notify Rep', icon: Bell, color: '#207290', description: 'Post an alert inside the CRM.' },
    ],
  },
  {
    key: 'tasks',
    label: 'Tasks & Productivity',
    nodes: [
      { type: 'create_task', label: 'Create Task', icon: ClipboardList, color: '#8b5cf6', description: 'Create a follow-up task.' },
    ],
  },
  {
    key: 'logic',
    label: 'Automation Utilities',
    nodes: [
      { type: 'condition', label: 'Condition (If / Else)', icon: GitBranch, color: '#f59e0b', description: 'Branch Yes / No based on a field.' },
      { type: 'router', label: 'Router / Switch', icon: Split, color: '#f59e0b', description: "Branch on a field's exact value." },
      { type: 'filter', label: 'Filter', icon: Filter, color: '#f59e0b', description: 'Only continue if a condition is met.' },
      { type: 'wait', label: 'Wait / Delay', icon: Clock, color: '#64748b', description: 'Pause for a set time, or until a date field is reached.' },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    nodes: [
      { type: 'webhook', label: 'Webhook / HTTP Request', icon: Webhook, color: '#334155', description: 'Call any external URL (Slack, Zapier, Make, n8n, or anything else that accepts a webhook).' },
    ],
  },
]

export const UPDATABLE_LEAD_FIELDS = [
  { field: 'phone', label: 'Phone' },
  { field: 'email', label: 'Email' },
  { field: 'clinic_name', label: 'Clinic Name' },
  { field: 'notes', label: 'Notes' },
  { field: 'estimated_value', label: 'Estimated Value' },
  { field: 'referral_source', label: 'Referral Source' },
  { field: 'intent_level', label: 'Intent Level' },
]

export const ALL_NODE_DEFS = NODE_CATEGORIES.flatMap((c) => c.nodes)

export function getNodeDef(type) {
  return ALL_NODE_DEFS.find((n) => n.type === type)
}

export const CONDITION_FIELDS = {
  lead: [
    { field: 'status', label: 'Status' },
    { field: 'ai_score', label: 'AI Score' },
    { field: 'intent_level', label: 'Intent Level' },
    { field: 'brand', label: 'Brand' },
    { field: 'case_interest', label: 'Case Interest' },
    { field: 'estimated_value', label: 'Estimated Value' },
  ],
  case: [
    { field: 'status', label: 'Stage' },
    { field: 'brand', label: 'Brand' },
    { field: 'case_type', label: 'Case Type' },
  ],
}

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
]

export function entityTypeForTrigger(triggerType) {
  return triggerType === 'case_status_changed' || triggerType === 'case_due_soon' ? 'case' : 'lead'
}

let idCounter = 0
export function newNodeId(type) {
  idCounter += 1
  return `${type}_${Date.now().toString(36)}${idCounter}`
}
