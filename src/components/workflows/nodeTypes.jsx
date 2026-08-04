import { Handle, Position } from '@xyflow/react'
import { Zap, StickyNote, Plus } from 'lucide-react'
import { getNodeDef, TRIGGER_DEFS } from './nodeDefs'

const HANDLE_CLASS = '!w-2.5 !h-2.5 !border-2 !bg-white'

function summarize(type, data = {}) {
  switch (type) {
    case 'send_email': return data.subject || 'No subject set'
    case 'notify_rep': return data.title || 'No title set'
    case 'add_tag': return data.tag ? `Tag: "${data.tag}"` : 'No tag set'
    case 'remove_tag': return data.tag ? `Tag: "${data.tag}"` : 'No tag set'
    case 'update_status': return data.status ? `Set to "${data.status}"` : 'No status set'
    case 'update_field': return data.field ? `${data.field} → "${data.value ?? ''}"` : 'No field set'
    case 'create_task': return data.title || 'No task title set'
    case 'create_note': return data.text || 'No note text set'
    case 'assign_rep': return data.assigned_to_name || 'No rep selected'
    case 'round_robin_assign': return 'Least-busy rep'
    case 'recalculate_score': return 'Re-scores the lead'
    case 'convert_to_client': return 'Creates a client record'
    case 'archive_lead': return 'Archives the lead'
    case 'webhook': return data.url || 'No URL set'
    case 'filter': return data.field ? `${data.field} ${data.operator || ''} ${data.value ?? ''}` : 'No condition set'
    case 'wait': return data.mode === 'until_field'
      ? (data.field ? `Until "${data.field}"` : 'No field set')
      : `${data.amount || 1} ${data.unit || 'days'}`
    default: return ''
  }
}

// Renders one or more "+" buttons directly inside the node's own DOM
// subtree (not as separate React Flow nodes/edges) — each button comes
// from `data._addStep`, injected by WorkflowCanvas.jsx per open (unconnected)
// source handle. Being a plain child element rather than a synthetic node
// wired up via a synthetic edge means it's just a normal button click with
// no dependency on React Flow's edge hit-testing/interaction-width
// internals, which is what made the earlier placeholder-node approach
// unreliable.
function AddButtons({ addSteps, leftPercents }) {
  if (!addSteps?.length) return null
  return addSteps.map((step, i) => {
    const left = leftPercents ? leftPercents[i] : 50
    return (
      <div
        key={step.handleId ?? 'default'}
        style={{ position: 'absolute', top: '100%', left: `${left}%`, transform: 'translateX(-50%)' }}
        className="flex flex-col items-center pointer-events-none"
      >
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); step.onClick() }}
          className="pointer-events-auto w-7 h-7 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:border-[#06babe] hover:text-[#06babe] transition-colors"
          title="Add a step"
        >
          <Plus size={14} />
        </button>
      </div>
    )
  })
}

export function TriggerNode({ data, selected }) {
  const def = TRIGGER_DEFS[data?.triggerType]
  return (
    <div
      className={`relative min-w-[210px] rounded-xl px-4 py-3 text-white shadow-md transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-[#06babe]' : ''}`}
      style={{ background: 'linear-gradient(135deg,#06babe,#207290)' }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold">Trigger</p>
          <p className="text-xs font-semibold truncate">{def?.label || data?.label || 'When this happens...'}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className={`${HANDLE_CLASS} !border-[#06babe]`} />
      <AddButtons addSteps={data?._addStep} />
    </div>
  )
}

function ActionNode({ type, data, selected }) {
  const def = getNodeDef(type)
  const Icon = def?.icon || Zap
  const color = def?.color || '#06babe'
  return (
    <div
      className={`relative min-w-[210px] rounded-xl border-2 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-[#06babe]' : ''}`}
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} style={{ borderColor: color }} />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{def?.label || type}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{summarize(type, data)}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className={HANDLE_CLASS} style={{ borderColor: color }} />
      <AddButtons addSteps={data?._addStep} />
    </div>
  )
}

export function WaitNode({ data, selected }) {
  const def = getNodeDef('wait')
  return (
    <div
      className={`relative min-w-[180px] rounded-full border-2 border-dashed bg-white dark:bg-slate-800 shadow-sm px-4 py-2.5 transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-[#06babe]' : ''}`}
      style={{ borderColor: def.color }}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} style={{ borderColor: def.color }} />
      <div className="flex items-center gap-2.5 justify-center">
        <def.icon size={14} style={{ color: def.color }} />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Wait {summarize('wait', data)}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className={HANDLE_CLASS} style={{ borderColor: def.color }} />
      <AddButtons addSteps={data?._addStep} />
    </div>
  )
}

export function ConditionNode({ data, selected }) {
  const def = getNodeDef('condition')
  const rule = data?.field ? `${data.field} ${data.operator || 'equals'} ${data.value ?? ''}` : 'No condition set'
  const addSteps = data?._addStep || []
  return (
    <div
      className={`relative min-w-[220px] rounded-xl border-2 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 pb-6 transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-[#06babe]' : ''}`}
      style={{ borderColor: def.color }}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} style={{ borderColor: def.color }} />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${def.color}1A` }}>
          <def.icon size={16} style={{ color: def.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Condition</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{rule}</p>
        </div>
      </div>
      <div className="flex justify-between mt-3 px-1 text-[10px] font-semibold">
        <span className="text-red-500">No</span>
        <span className="text-green-600">Yes</span>
      </div>
      <Handle type="source" id="no" position={Position.Bottom} style={{ left: '25%', borderColor: def.color }} className={HANDLE_CLASS} />
      <Handle type="source" id="yes" position={Position.Bottom} style={{ left: '75%', borderColor: def.color }} className={HANDLE_CLASS} />
      <AddButtons addSteps={addSteps} leftPercents={addSteps.map((s) => (s.handleId === 'yes' ? 75 : 25))} />
    </div>
  )
}

export function RouterNode({ data, selected }) {
  const def = getNodeDef('router')
  const cases = data?.cases?.length ? data.cases : [{ value: 'default', label: 'Default' }]
  const total = cases.length
  const percentFor = (value) => {
    const i = cases.findIndex((c) => c.value === value)
    return ((i + 1) / (total + 1)) * 100
  }
  const addSteps = data?._addStep || []
  return (
    <div
      className={`relative min-w-[220px] rounded-xl border-2 bg-white dark:bg-slate-800 shadow-sm px-4 py-3 pb-6 transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-[#06babe]' : ''}`}
      style={{ borderColor: def.color }}
    >
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} style={{ borderColor: def.color }} />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${def.color}1A` }}>
          <def.icon size={16} style={{ color: def.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Router</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{data?.field ? `on "${data.field}"` : 'No field set'}</p>
        </div>
      </div>
      <div className="flex justify-between mt-3 px-1 text-[10px] font-semibold text-slate-500 truncate">
        {cases.map((c) => <span key={c.value} className="truncate max-w-[60px]">{c.label || c.value}</span>)}
      </div>
      {cases.map((c, i) => (
        <Handle
          key={c.value}
          type="source"
          id={c.value}
          position={Position.Bottom}
          style={{ left: `${((i + 1) / (total + 1)) * 100}%`, borderColor: def.color }}
          className={HANDLE_CLASS}
        />
      ))}
      <AddButtons addSteps={addSteps} leftPercents={addSteps.map((s) => percentFor(s.handleId))} />
    </div>
  )
}

export function StickyNoteNode({ data, selected }) {
  return (
    <div
      className={`min-w-[180px] max-w-[220px] rounded-lg shadow-sm px-3.5 py-3 transition-shadow ${selected ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}
      style={{ background: '#FEF3C7' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5 text-amber-700">
        <StickyNote size={12} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Note</span>
      </div>
      <p className="text-xs text-amber-900 whitespace-pre-wrap break-words">{data?.text || 'Click to add a note...'}</p>
    </div>
  )
}

const ACTION_TYPES = [
  'send_email', 'notify_rep', 'add_tag', 'remove_tag', 'update_status', 'update_field',
  'create_task', 'create_note', 'assign_rep', 'round_robin_assign', 'recalculate_score',
  'convert_to_client', 'archive_lead', 'webhook', 'filter',
]
const actionNodeEntries = ACTION_TYPES.map((type) => [type, (props) => <ActionNode {...props} type={type} />])

export const nodeTypes = {
  trigger: TriggerNode,
  wait: WaitNode,
  condition: ConditionNode,
  router: RouterNode,
  sticky_note: StickyNoteNode,
  ...Object.fromEntries(actionNodeEntries),
}
