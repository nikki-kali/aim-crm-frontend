import { Mail, Bell, Tag, RefreshCw, ClipboardList, UserPlus, GitBranch, Split, Filter, Clock } from 'lucide-react'

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

export const NODE_CATEGORIES = [
  {
    key: 'actions',
    label: 'Actions',
    nodes: [
      { type: 'send_email', label: 'Send Email', icon: Mail, color: '#06babe', description: 'Email the lead, or the assigned rep.' },
      { type: 'notify_rep', label: 'Notify Rep', icon: Bell, color: '#207290', description: 'Post an alert inside the CRM.' },
      { type: 'create_task', label: 'Create Task', icon: ClipboardList, color: '#8b5cf6', description: 'Create a follow-up task.' },
      { type: 'add_tag', label: 'Add Tag', icon: Tag, color: '#0ea5e9', description: 'Tag the lead.' },
      { type: 'update_status', label: 'Update Status', icon: RefreshCw, color: '#16a34a', description: 'Change the lead or case status.' },
      { type: 'assign_rep', label: 'Assign Rep', icon: UserPlus, color: '#f97316', description: 'Assign the lead to a rep.' },
    ],
  },
  {
    key: 'logic',
    label: 'Logic',
    nodes: [
      { type: 'condition', label: 'Condition', icon: GitBranch, color: '#f59e0b', description: 'Branch Yes / No based on a field.' },
      { type: 'router', label: 'Router', icon: Split, color: '#f59e0b', description: "Branch on a field's exact value." },
      { type: 'filter', label: 'Filter', icon: Filter, color: '#f59e0b', description: 'Only continue if a condition is met.' },
    ],
  },
  {
    key: 'flow',
    label: 'Flow',
    nodes: [
      { type: 'wait', label: 'Wait', icon: Clock, color: '#64748b', description: 'Pause before continuing.' },
    ],
  },
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
