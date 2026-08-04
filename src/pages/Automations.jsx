import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Users2, Activity, ArrowRight } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import EmptyState from '../components/EmptyState'
import { SkeletonCards } from '../components/Skeleton'
import { TRIGGER_DEFS, getNodeDef } from '../components/workflows/nodeDefs'

const BRAND_COLORS = { 'Aim Dental': '#06babe', 'Kings Highway': '#207290', All: '#64748b' }
const BRANDS = ['All', 'Aim Dental', 'Kings Highway']

function summarizeWorkflow(wf) {
  const steps = (wf.nodes || []).filter((n) => n.type !== 'trigger' && n.type !== 'sticky_note')
  if (steps.length === 0) return 'No steps yet'
  const first = getNodeDef(steps[0].type)?.label || steps[0].type
  return steps.length > 1 ? `${first} +${steps.length - 1} more` : first
}

export default function Automations() {
  const navigate = useNavigate()
  const toast = useToast()
  const [templates, setTemplates] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState('All')
  const [creating, setCreating] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [t, w] = await Promise.all([api.get('/api/workflows/templates'), api.get('/api/workflows')])
      setTemplates(t || [])
      setWorkflows(w || [])
    } catch {
      toast('Failed to load automations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createFromTemplate = async (tpl) => {
    setCreating(true)
    try {
      const wf = await api.post('/api/workflows', {
        name: tpl.name,
        description: tpl.description,
        trigger_type: tpl.trigger_type,
        trigger_config: tpl.trigger_config,
        nodes: tpl.nodes,
        edges: tpl.edges,
      })
      navigate(`/automations/${wf.id}`)
    } catch (err) {
      toast(err.message || 'Failed to create workflow', 'error')
      setCreating(false)
    }
  }

  const createBlank = async () => {
    setCreating(true)
    try {
      const wf = await api.post('/api/workflows', {
        name: 'New Workflow',
        trigger_type: 'new_lead_created',
        trigger_config: {},
        nodes: [{ id: 'trigger', type: 'trigger', position: { x: 300, y: 40 }, data: { triggerType: 'new_lead_created', config: {} } }],
        edges: [],
      })
      navigate(`/automations/${wf.id}`)
    } catch (err) {
      toast(err.message || 'Failed to create workflow', 'error')
      setCreating(false)
    }
  }

  const deleteWorkflow = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this workflow? This cannot be undone.')) return
    try {
      await api.delete(`/api/workflows/${id}`)
      setWorkflows((prev) => prev.filter((w) => w.id !== id))
      toast('Workflow deleted', 'success')
    } catch (err) {
      toast(err.message || 'Failed to delete workflow', 'error')
    }
  }

  const filteredWorkflows = workflows.filter((w) => brandFilter === 'All' || w.brand === brandFilter || w.brand === 'All')

  if (loading) {
    return (
      <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto">
        <SkeletonCards rows={3} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Automations</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Build multi-step workflows that trigger off leads and cases automatically.</p>
        </div>
        <button data-tour="automations-new" onClick={createBlank} disabled={creating} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={14} /> New Workflow
        </button>
      </div>

      <div className="mb-4 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 text-xs font-medium w-fit">
        {BRANDS.map((b) => (
          <button
            key={b}
            onClick={() => setBrandFilter(b)}
            className={`px-3 py-1.5 rounded-full transition-colors ${brandFilter === b ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Templates</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => createFromTemplate(tpl)}
              disabled={creating}
              className="text-left card p-4 hover:border-[#06babe] transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tpl.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">{tpl.description}</p>
              <p className="text-[11px] text-[#06babe] font-medium mt-3 flex items-center gap-1">
                Use template <ArrowRight size={11} />
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Your Automations</p>
        {filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No automations yet"
            description="Use a template above or start a new workflow from scratch."
          />
        ) : (
          <div data-tour="automations-list" className="grid gap-3">
            {filteredWorkflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => navigate(`/automations/${wf.id}`)}
                className="card p-4 sm:p-5 cursor-pointer flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND_COLORS[wf.brand] || '#06babe'}1A` }}>
                  <Activity size={17} style={{ color: BRAND_COLORS[wf.brand] || '#06babe' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{wf.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${wf.active ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {wf.active ? 'Active' : 'Paused'}
                    </span>
                    {wf.brand !== 'All' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${BRAND_COLORS[wf.brand]}1A`, color: BRAND_COLORS[wf.brand] }}>
                        {wf.brand}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                    {TRIGGER_DEFS[wf.trigger_type]?.label || wf.trigger_type} → {summarizeWorkflow(wf)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 justify-end"><Users2 size={11} /> {wf.enrolled_count || 0}</p>
                  <p className="text-[10px] text-slate-400">enrolled</p>
                </div>
                <button onClick={(e) => deleteWorkflow(e, wf.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0 p-1.5">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
