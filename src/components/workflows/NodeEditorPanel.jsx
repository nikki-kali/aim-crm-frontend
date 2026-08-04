import { X, Trash2, Plus } from 'lucide-react'
import { getNodeDef, TRIGGER_DEFS, CASE_STAGES, CONDITION_FIELDS, CONDITION_OPERATORS, entityTypeForTrigger, UPDATABLE_LEAD_FIELDS } from './nodeDefs'

const LEAD_STATUSES = ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost']

function Field({ label, children }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  )
}

export default function NodeEditorPanel({ node, entityType, reps, onChange, onDelete, onClose }) {
  if (!node) return null
  const data = node.data || {}
  const update = (patch) => onChange(node.id, { ...data, ...patch })
  const def = getNodeDef(node.type)

  return (
    <div className="w-full sm:w-80 flex-shrink-0 border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {node.type === 'trigger' ? 'Trigger' : def?.label || node.type}
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {node.type === 'trigger' && (
          <>
            <Field label="When...">
              <select className="input" value={data.triggerType || ''} onChange={(e) => {
                const tt = e.target.value
                const cfgDef = TRIGGER_DEFS[tt]
                update({ triggerType: tt, config: cfgDef?.configField ? { [cfgDef.configField]: cfgDef.configDefault } : {} })
              }}>
                <option value="" disabled>Select a trigger...</option>
                {Object.entries(TRIGGER_DEFS).map(([key, d]) => (
                  <option key={key} value={key}>{d.label}</option>
                ))}
              </select>
            </Field>
            {data.triggerType && TRIGGER_DEFS[data.triggerType] && (
              <p className="text-xs text-slate-400 leading-relaxed -mt-2">{TRIGGER_DEFS[data.triggerType].description}</p>
            )}
            {data.triggerType && TRIGGER_DEFS[data.triggerType]?.configField && (
              <Field label={TRIGGER_DEFS[data.triggerType].configLabel}>
                {TRIGGER_DEFS[data.triggerType].configType === 'case_status' ? (
                  <select className="input" value={data.config?.status || ''} onChange={(e) => update({ config: { ...data.config, status: e.target.value } })}>
                    {CASE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type="number"
                    className="input"
                    value={data.config?.[TRIGGER_DEFS[data.triggerType].configField] ?? ''}
                    onChange={(e) => update({ config: { ...data.config, [TRIGGER_DEFS[data.triggerType].configField]: Number(e.target.value) } })}
                  />
                )}
              </Field>
            )}
          </>
        )}

        {node.type === 'send_email' && (
          <>
            <Field label="Send to">
              <select className="input" value={data.to || 'entity'} onChange={(e) => update({ to: e.target.value })}>
                <option value="entity">Lead's / doctor's email</option>
                <option value="assigned_rep">Assigned rep</option>
              </select>
            </Field>
            <Field label="Subject">
              <input className="input" value={data.subject || ''} onChange={(e) => update({ subject: e.target.value })} placeholder="Update from Aim Dental CRM" />
            </Field>
            <Field label="Body (HTML)">
              <textarea className="input min-h-[120px] font-mono text-xs" value={data.body || ''} onChange={(e) => update({ body: e.target.value })} placeholder="<p>Hi there...</p>" />
            </Field>
          </>
        )}

        {node.type === 'notify_rep' && (
          <>
            <Field label="Alert title">
              <input className="input" value={data.title || ''} onChange={(e) => update({ title: e.target.value })} placeholder="Cold Lead" />
            </Field>
            <Field label="Message">
              <textarea className="input min-h-[90px]" value={data.message || ''} onChange={(e) => update({ message: e.target.value })} placeholder="This lead needs follow-up..." />
            </Field>
          </>
        )}

        {(node.type === 'add_tag' || node.type === 'remove_tag') && (
          <Field label="Tag">
            <input className="input" value={data.tag || ''} onChange={(e) => update({ tag: e.target.value })} placeholder="e.g. hot-lead" />
          </Field>
        )}

        {node.type === 'update_field' && (
          <>
            <Field label="Field">
              <select className="input" value={data.field || ''} onChange={(e) => update({ field: e.target.value })}>
                <option value="" disabled>Select a field...</option>
                {UPDATABLE_LEAD_FIELDS.map((f) => <option key={f.field} value={f.field}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="New value">
              <input className="input" value={data.value ?? ''} onChange={(e) => update({ value: e.target.value })} />
            </Field>
          </>
        )}

        {node.type === 'update_status' && (
          <Field label={entityType === 'case' ? 'New stage' : 'New status'}>
            <select className="input" value={data.status || ''} onChange={(e) => update({ status: e.target.value })}>
              <option value="" disabled>Select...</option>
              {(entityType === 'case' ? CASE_STAGES : LEAD_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}

        {node.type === 'create_task' && (
          <>
            <Field label="Task title">
              <input className="input" value={data.title || ''} onChange={(e) => update({ title: e.target.value })} placeholder="Follow up" />
            </Field>
            <Field label="Due in (days from now)">
              <input type="number" min="0" className="input" value={data.due_in_days ?? ''} onChange={(e) => update({ due_in_days: Number(e.target.value) })} />
            </Field>
            <Field label="Assign to">
              <select className="input" value={data.assigned_to || ''} onChange={(e) => update({ assigned_to: e.target.value || null })}>
                <option value="">Same as lead's rep</option>
                {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
          </>
        )}

        {node.type === 'assign_rep' && (
          <Field label="Assign to">
            <select className="input" value={data.assigned_to || ''} onChange={(e) => update({ assigned_to: e.target.value, assigned_to_name: reps.find((r) => r.id === e.target.value)?.name })}>
              <option value="" disabled>Select a rep...</option>
              {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
        )}

        {node.type === 'round_robin_assign' && (
          <p className="text-xs text-slate-400 leading-relaxed">No setup needed — this looks at every staff rep's current active lead count and assigns to whoever has the fewest.</p>
        )}

        {node.type === 'recalculate_score' && (
          <p className="text-xs text-slate-400 leading-relaxed">No setup needed — re-runs the same AI scoring formula used when leads are created or imported.</p>
        )}

        {node.type === 'convert_to_client' && (
          <p className="text-xs text-slate-400 leading-relaxed">No setup needed — creates a client record from this lead's data, same as clicking "Convert" on the Leads page. Leads already converted are skipped.</p>
        )}

        {node.type === 'archive_lead' && (
          <p className="text-xs text-slate-400 leading-relaxed">No setup needed — archives the lead so it drops out of active views.</p>
        )}

        {node.type === 'create_note' && (
          <Field label="Note text">
            <textarea className="input min-h-[90px]" value={data.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="e.g. Auto-logged by workflow..." />
          </Field>
        )}

        {node.type === 'webhook' && (
          <>
            <Field label="URL">
              <input className="input" value={data.url || ''} onChange={(e) => update({ url: e.target.value })} placeholder="https://hooks.slack.com/..." />
            </Field>
            <Field label="Method">
              <select className="input" value={data.method || 'POST'} onChange={(e) => update({ method: e.target.value })}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </Field>
            <p className="text-xs text-slate-400 leading-relaxed">Sends the lead or case's data as JSON to this URL — works with Slack incoming webhooks, Zapier, Make, n8n, or any endpoint that accepts one.</p>
          </>
        )}

        {(node.type === 'condition' || node.type === 'filter') && (
          <ConditionFields data={data} entityType={entityType} onChange={update} />
        )}

        {node.type === 'router' && (
          <RouterFields data={data} entityType={entityType} onChange={update} />
        )}

        {node.type === 'wait' && (
          <>
            <Field label="Wait for">
              <select className="input" value={data.mode || 'relative'} onChange={(e) => update({ mode: e.target.value })}>
                <option value="relative">A set amount of time</option>
                <option value="until_field">Until a date field is reached</option>
              </select>
            </Field>
            {data.mode === 'until_field' ? (
              <Field label="Date field">
                <select className="input" value={data.field || ''} onChange={(e) => update({ field: e.target.value })}>
                  <option value="" disabled>Select a field...</option>
                  {(entityType === 'case' ? ['due_date'] : ['last_contacted_at']).map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
            ) : (
              <>
                <Field label="Amount">
                  <input type="number" min="1" className="input" value={data.amount ?? 1} onChange={(e) => update({ amount: Number(e.target.value) })} />
                </Field>
                <Field label="Unit">
                  <select className="input" value={data.unit || 'days'} onChange={(e) => update({ unit: e.target.value })}>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </Field>
              </>
            )}
          </>
        )}

        {node.type === 'sticky_note' && (
          <Field label="Note">
            <textarea autoFocus className="input min-h-[100px]" value={data.text || ''} onChange={(e) => update({ text: e.target.value })} />
          </Field>
        )}
      </div>

      {node.type !== 'trigger' && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button onClick={() => onDelete(node.id)} className="btn-danger text-xs w-full justify-center">
            <Trash2 size={13} /> Delete step
          </button>
        </div>
      )}
    </div>
  )
}

function ConditionFields({ data, entityType, onChange }) {
  const fields = CONDITION_FIELDS[entityType] || CONDITION_FIELDS.lead
  return (
    <>
      <Field label="Field">
        <select className="input" value={data.field || ''} onChange={(e) => onChange({ field: e.target.value })}>
          <option value="" disabled>Select a field...</option>
          {fields.map((f) => <option key={f.field} value={f.field}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Operator">
        <select className="input" value={data.operator || 'equals'} onChange={(e) => onChange({ operator: e.target.value })}>
          {CONDITION_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Value">
        <input className="input" value={data.value ?? ''} onChange={(e) => onChange({ value: e.target.value })} />
      </Field>
    </>
  )
}

function RouterFields({ data, entityType, onChange }) {
  const fields = CONDITION_FIELDS[entityType] || CONDITION_FIELDS.lead
  const cases = data.cases?.length ? data.cases : [{ value: '', label: '' }]

  const updateCase = (i, patch) => {
    const next = cases.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onChange({ cases: next })
  }
  const addCase = () => onChange({ cases: [...cases, { value: '', label: '' }] })
  const removeCase = (i) => onChange({ cases: cases.filter((_, idx) => idx !== i) })

  return (
    <>
      <Field label="Field">
        <select className="input" value={data.field || ''} onChange={(e) => onChange({ field: e.target.value })}>
          <option value="" disabled>Select a field...</option>
          {fields.map((f) => <option key={f.field} value={f.field}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Branches (matched by exact value)">
        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input className="input flex-1" placeholder="Value" value={c.value} onChange={(e) => updateCase(i, { value: e.target.value, label: e.target.value })} />
              <button onClick={() => removeCase(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
            </div>
          ))}
          <button onClick={addCase} className="btn-ghost text-xs"><Plus size={12} /> Add branch</button>
        </div>
      </Field>
    </>
  )
}
