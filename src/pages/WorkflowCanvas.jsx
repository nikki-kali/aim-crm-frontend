import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, useNodesState, useEdgesState, addEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, StickyNote, Play, ListChecks, Workflow } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/Toast'
import { Skeleton } from '../components/Skeleton'
import { nodeTypes } from '../components/workflows/nodeTypes'
import NodeEditorPanel from '../components/workflows/NodeEditorPanel'
import AddStepModal from '../components/workflows/AddStepModal'
import { TRIGGER_DEFS, entityTypeForTrigger, newNodeId, getNodeDef } from '../components/workflows/nodeDefs'

const NODE_WIDTH = 220

function sourceHandlesFor(node) {
  switch (node.type) {
    case 'condition': return ['no', 'yes']
    case 'router': {
      const cases = node.data?.cases?.length ? node.data.cases : [{ value: 'default' }]
      return cases.map((c) => c.value || 'default')
    }
    case 'sticky_note': return []
    default: return [null]
  }
}

function handleOffsetX(node, handleId, index, total) {
  if (node.type === 'condition') return handleId === 'yes' ? NODE_WIDTH * 0.25 : -NODE_WIDTH * 0.25
  if (node.type === 'router') return ((index + 1) / (total + 1) - 0.5) * NODE_WIDTH
  return 0
}

function CanvasInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reps, setReps] = useState([])
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [tab, setTab] = useState('canvas')
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ticking, setTicking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const pendingConnection = useRef(null)
  const idCounter = useRef(0)

  useEffect(() => {
    (async () => {
      try {
        const [wf, repsData] = await Promise.all([api.get(`/api/workflows/${id}`), api.get('/api/users/reps')])
        setReps(repsData || [])
        let wfNodes = wf.nodes?.length ? wf.nodes : [{ id: 'trigger', type: 'trigger', position: { x: 300, y: 40 }, data: {} }]
        // Normalize: the trigger node's data is the editable source of truth
        // in the canvas UI; backfill it from the workflow row in case it was
        // created via a template (whose trigger node only carries a label).
        wfNodes = wfNodes.map((n) => n.type === 'trigger'
          ? { ...n, data: { ...n.data, triggerType: n.data?.triggerType || wf.trigger_type, config: n.data?.config || wf.trigger_config } }
          : n)
        setWorkflow(wf)
        setNodes(wfNodes)
        setEdges(wf.edges || [])
      } catch (err) {
        toast(err.message || 'Failed to load workflow', 'error')
        navigate('/automations')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (tab !== 'runs') return
    setRunsLoading(true)
    api.get(`/api/workflows/${id}/runs`).then(setRuns).catch(() => {}).finally(() => setRunsLoading(false))
  }, [tab, id])

  const triggerNode = nodes.find((n) => n.type === 'trigger')
  const entityType = entityTypeForTrigger(triggerNode?.data?.triggerType || workflow?.trigger_type)

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  const openAddModal = (source, sourceHandle) => {
    pendingConnection.current = source ? { source, sourceHandle } : null
    setModalOpen(true)
  }

  const handleAddNode = (def) => {
    idCounter.current += 1
    const pc = pendingConnection.current
    let position = { x: 300, y: 400 }
    if (pc) {
      const src = nodes.find((n) => n.id === pc.source)
      if (src) {
        const handles = sourceHandlesFor(src)
        const idx = handles.indexOf(pc.sourceHandle ?? null)
        position = { x: src.position.x + handleOffsetX(src, pc.sourceHandle, idx, handles.length) - NODE_WIDTH / 2 + 60, y: src.position.y + 130 }
      }
    }
    const newId = newNodeId(def.type)
    const defaultData = def.type === 'wait' ? { amount: 1, unit: 'days' } : def.type === 'condition' || def.type === 'filter' ? { operator: 'equals' } : {}
    const newNode = { id: newId, type: def.type, position, data: defaultData }
    setNodes((nds) => [...nds, newNode])
    if (pc) {
      setEdges((eds) => [...eds, { id: `e_${pc.source}_${pc.sourceHandle || 'd'}_${newId}`, source: pc.source, sourceHandle: pc.sourceHandle || undefined, target: newId }])
    }
    setSelectedNodeId(newId)
    setModalOpen(false)
    pendingConnection.current = null
  }

  const addStickyNote = () => {
    idCounter.current += 1
    const newId = newNodeId('sticky_note')
    setNodes((nds) => [...nds, { id: newId, type: 'sticky_note', position: { x: 550, y: 40 }, data: { text: '' } }])
    setSelectedNodeId(newId)
  }

  const updateNodeData = (nodeId, data) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)))
  }

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNodeId(null)
  }

  // Injects a "+" button descriptor onto each real node's data for every
  // open (unconnected) source handle, rendered by the node component itself
  // (see nodeTypes.jsx's AddButtons) — a plain child button in the node's
  // own DOM subtree, not a separate React Flow node/edge, so it's just a
  // normal click with no dependency on edge hit-testing internals.
  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.type === 'sticky_note') return node
      const handles = sourceHandlesFor(node)
      const addStep = handles
        .filter((h) => !edges.some((e) => e.source === node.id && (e.sourceHandle || null) === (h || null)))
        .map((h) => ({ handleId: h, onClick: () => openAddModal(node.id, h) }))
      return { ...node, data: { ...node.data, _addStep: addStep } }
    })
  }, [nodes, edges])

  const save = async (overrides = {}) => {
    if (!triggerNode?.data?.triggerType) {
      toast('Set a trigger before saving', 'error')
      return
    }
    setSaving(true)
    try {
      const realNodes = nodes
      const updated = await api.put(`/api/workflows/${id}`, {
        name: workflow.name,
        brand: workflow.brand,
        trigger_type: triggerNode.data.triggerType,
        trigger_config: triggerNode.data.config || {},
        nodes: realNodes,
        edges,
        ...overrides,
      })
      setWorkflow(updated)
      toast('Workflow saved', 'success')
    } catch (err) {
      toast(err.message || 'Failed to save workflow', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    await save({ active: !workflow.active })
  }

  const runTick = async () => {
    setTicking(true)
    try {
      const result = await api.post('/api/workflows/tick')
      toast(`Engine ran — ${result.enrolled} enrolled, ${result.advanced} advanced`, 'success')
      if (tab === 'runs') {
        const r = await api.get(`/api/workflows/${id}/runs`)
        setRuns(r)
      }
    } catch (err) {
      toast(err.message || 'Engine run failed', 'error')
    } finally {
      setTicking(false)
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/automations')} className="btn-ghost !px-2"><ArrowLeft size={16} /></button>
          <input
            value={workflow.name}
            onChange={(e) => setWorkflow((w) => ({ ...w, name: e.target.value }))}
            className="font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base min-w-0"
          />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${workflow.active ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {workflow.active ? 'Active' : 'Paused'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 text-xs font-medium">
            <button onClick={() => setTab('canvas')} className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${tab === 'canvas' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>
              <Workflow size={12} /> Canvas
            </button>
            <button onClick={() => setTab('runs')} className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${tab === 'runs' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>
              <ListChecks size={12} /> Run History
            </button>
          </div>
          <button onClick={runTick} disabled={ticking} className="btn-secondary text-xs disabled:opacity-50">
            <Play size={12} /> {ticking ? 'Running...' : 'Run Engine Now'}
          </button>
          <button onClick={toggleActive} disabled={saving} className={workflow.active ? 'btn-secondary text-xs' : 'btn-primary text-xs'}>
            {workflow.active ? 'Pause' : 'Activate'}
          </button>
          <button onClick={() => save()} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {tab === 'canvas' ? (
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 relative">
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChangeRaw}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} color="#e2e8f0" />
              <Controls position="bottom-left" showInteractive={false} />
            </ReactFlow>
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button onClick={addStickyNote} className="btn-secondary text-xs shadow-md"><StickyNote size={12} /> Add note</button>
            </div>
          </div>
          {selectedNode && (
            <NodeEditorPanel
              node={selectedNode}
              entityType={entityType}
              reps={reps}
              onChange={updateNodeData}
              onDelete={deleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {runsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">No runs yet — activate this workflow or click "Run Engine Now".</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">When</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Step</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Result</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-t border-slate-50 dark:border-slate-800">
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{getNodeDef(r.node_type)?.label || r.node_type}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{r.result}</td>
                      <td className="px-4 py-2.5 text-slate-400">{r.entity_type} · {r.entity_id.slice(0, 8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && <AddStepModal onClose={() => { setModalOpen(false); pendingConnection.current = null }} onAdd={handleAddNode} />}
    </div>
  )
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
