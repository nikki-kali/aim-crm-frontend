import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  ChevronDown, ChevronUp, Plus, Check, X, RefreshCw,
  MessageSquare, Trash2, Link2, CheckCircle,
  Target, CheckSquare, AlertCircle, Users, Lightbulb,
} from 'lucide-react'

// ── Suggestions Panel ─────────────────────────────────────────────────────────

const SUGGESTION_STYLES = {
  high:   { bar: 'bg-red-500',   badge: 'bg-red-50 border-red-100',   text: 'text-red-700',   label: 'Needs Attention' },
  medium: { bar: 'bg-amber-400', badge: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Worth Noting' },
  low:    { bar: 'bg-green-500', badge: 'bg-green-50 border-green-100', text: 'text-green-700', label: 'Great Work' },
}

const TYPE_ICON = {
  rock:  Target,
  todo:  CheckSquare,
  issue: AlertCircle,
  lead:  Users,
}

function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/eos/suggestions')
      .then(d => { setSuggestions(d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-4 h-4 border-2 border-[#06babe]/30 border-t-[#06babe] rounded-full animate-spin" />
      <span className="text-sm text-gray-400">Analysing your EOS data...</span>
    </div>
  )

  if (suggestions.length === 0) return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
        <CheckCircle size={16} className="text-green-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">You're all on track!</p>
        <p className="text-xs text-gray-400 mt-0.5">No issues flagged across your rocks, to-dos, issues, or leads.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={14} className="text-[#06babe]" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestions for you</p>
      </div>
      {suggestions.map((s, i) => {
        const style = SUGGESTION_STYLES[s.priority]
        const Icon = TYPE_ICON[s.type] || Lightbulb
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.badge} relative overflow-hidden`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar} rounded-l-xl`} />
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 ${style.badge}`}>
              <Icon size={14} className={style.text} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{s.message}</p>
              {s.action && (
                <p className={`text-xs font-medium mt-1 ${style.text}`}>{s.action} →</p>
              )}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${style.badge} ${style.text}`}>
              {style.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

const TABS = [
  { key: 'rocks',  label: 'Rocks' },
  { key: 'todos',  label: 'Weekly To-Dos' },
  { key: 'issues', label: 'Issues List' },
]

const STATUS_COLORS = {
  'On Track': 'bg-green-100 text-green-700',
  'Off Track': 'bg-red-100 text-red-700',
  'Done':      'bg-gray-100 text-gray-500',
}

const PRIORITY_COLORS = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-gray-100 text-gray-500',
}

const IDS_COLORS = {
  Identified: 'bg-amber-100 text-amber-700',
  Discussed:  'bg-blue-100 text-blue-700',
  Solved:     'bg-green-100 text-green-700',
}

function getCurrentQuarter() {
  const now = new Date()
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
}

// ── Rock Card ──────────────────────────────────────────────────────────────────

function RockCard({ rock, isAdmin, currentUserId, onStatusChange, onMilestoneToggle, onAddMilestone, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [savingMilestone, setSavingMilestone] = useState(false)

  const canEdit = isAdmin || rock.owner_id === currentUserId
  const milestones = rock.milestones || []
  const done = milestones.filter(m => m.completed).length
  const total = milestones.length

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return
    setSavingMilestone(true)
    await onAddMilestone(rock.id, newMilestone.trim())
    setNewMilestone('')
    setAddingMilestone(false)
    setSavingMilestone(false)
  }

  return (
    <div className="card p-4 mb-3">
      <div
        className="flex items-start justify-between cursor-pointer gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_COLORS[rock.status] || 'bg-gray-100 text-gray-500'}`}>
            {rock.status}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 leading-snug">{rock.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {rock.owner_name && (
                <span className="text-xs text-[#06babe] font-medium">{rock.owner_name}</span>
              )}
              <span className="text-xs text-gray-400">{rock.quarter}</span>
              {rock.due_date && (
                <span className="text-xs text-gray-400">
                  Due {new Date(rock.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {total > 0 && (
            <span className="text-xs text-gray-400">{done}/{total}</span>
          )}
          {expanded
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              {rock.description && (
                <p className="text-sm text-gray-500">{rock.description}</p>
              )}

              {/* Milestones */}
              {milestones.length > 0 && (
                <div className="space-y-2">
                  {milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 text-sm">
                      <button
                        onClick={() => canEdit && onMilestoneToggle(rock.id, m.id, !m.completed)}
                        disabled={!canEdit}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          m.completed
                            ? 'bg-[#06babe] border-[#06babe] text-white'
                            : 'border-gray-300 hover:border-[#06babe]'
                        } ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {m.completed && <Check size={10} strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {m.description}
                      </span>
                      {m.due_date && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add milestone */}
              {canEdit && (
                addingMilestone ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="input text-sm flex-1"
                      placeholder="Milestone description…"
                      value={newMilestone}
                      onChange={e => setNewMilestone(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddMilestone()
                        if (e.key === 'Escape') { setAddingMilestone(false); setNewMilestone('') }
                      }}
                    />
                    <button onClick={handleAddMilestone} disabled={savingMilestone} className="btn-primary text-xs px-3">
                      {savingMilestone ? '…' : 'Add'}
                    </button>
                    <button onClick={() => { setAddingMilestone(false); setNewMilestone('') }} className="btn-secondary text-xs px-3">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setAddingMilestone(true) }}
                    className="text-xs text-[#06babe] hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} /> Add milestone
                  </button>
                )
              )}

              {/* Status change + delete */}
              {canEdit && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                  {rock.status !== 'Done' && (
                    <>
                      {rock.status !== 'Off Track' && (
                        <button
                          onClick={() => onStatusChange(rock.id, 'Off Track')}
                          className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Mark Off Track
                        </button>
                      )}
                      {rock.status !== 'On Track' && (
                        <button
                          onClick={() => onStatusChange(rock.id, 'On Track')}
                          className="text-xs text-green-600 hover:bg-green-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Mark On Track
                        </button>
                      )}
                      <button
                        onClick={() => onStatusChange(rock.id, 'Done')}
                        className="text-xs text-gray-600 hover:bg-gray-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Mark Done
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(rock.id)}
                      className="ml-auto text-xs text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Issue Card ─────────────────────────────────────────────────────────────────

function IssueCard({ issue, isAdmin, currentUser, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [discussionNotes, setDiscussionNotes] = useState(issue.discussion_notes || '')
  const [solutionNotes, setSolutionNotes] = useState(issue.solution_notes || '')
  const [advancing, setAdvancing] = useState(false)

  const loadComments = async () => {
    if (comments.length > 0) return
    setLoadingComments(true)
    const data = await api.get(`/api/issues/${issue.id}/comments`).catch(() => [])
    setComments(data || [])
    setLoadingComments(false)
  }

  const handleExpand = () => {
    setExpanded(v => !v)
    if (!expanded) loadComments()
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    const data = await api.post(`/api/issues/${issue.id}/comments`, { comment: newComment.trim() }).catch(() => null)
    if (data) {
      setComments(c => [...c, data])
      setNewComment('')
    }
  }

  const handleAdvance = async (nextStatus) => {
    setAdvancing(true)
    const body = { status: nextStatus }
    if (nextStatus === 'Discussed' && discussionNotes.trim()) body.discussion_notes = discussionNotes
    if (nextStatus === 'Solved' && solutionNotes.trim()) body.solution_notes = solutionNotes
    await onStatusChange(issue.id, body)
    setAdvancing(false)
  }

  const canDiscuss = isAdmin || issue.owner_id === currentUser?.id
  const canSolve = isAdmin

  return (
    <div className="card p-4 mb-3">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={handleExpand}>
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${PRIORITY_COLORS[issue.priority]}`}>
            {issue.priority}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 leading-snug">{issue.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-400">by {issue.raised_by_name || 'Unknown'}</span>
              {issue.rock_title && (
                <span className="text-xs text-[#06babe] flex items-center gap-0.5">
                  <Link2 size={9} /> {issue.rock_title}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {Number(issue.comment_count) > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <MessageSquare size={11} /> {issue.comment_count}
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${IDS_COLORS[issue.status] || ''}`}>
            {issue.status}
          </span>
          {expanded
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
              {issue.description && (
                <p className="text-sm text-gray-600">{issue.description}</p>
              )}

              {issue.discussion_notes && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Discussion Notes</p>
                  <p className="text-sm text-gray-700">{issue.discussion_notes}</p>
                </div>
              )}

              {issue.solution_notes && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-green-600 mb-1">Solution</p>
                  <p className="text-sm text-gray-700">{issue.solution_notes}</p>
                </div>
              )}

              {/* Comments */}
              {loadingComments ? (
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" /> Loading comments…
                </div>
              ) : comments.length > 0 && (
                <div className="space-y-2.5">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#06babe]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#06babe]">
                        {(c.user_name || '?')[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700">{c.user_name}</p>
                        <p className="text-sm text-gray-600">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button onClick={handleAddComment} className="btn-secondary text-xs px-3">Add</button>
              </div>

              {/* IDS advance — Identified → Discussed */}
              {issue.status === 'Identified' && canDiscuss && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Move to Discussed</p>
                  <textarea
                    className="input text-sm w-full resize-none"
                    rows={2}
                    placeholder="Discussion notes (optional)…"
                    value={discussionNotes}
                    onChange={e => setDiscussionNotes(e.target.value)}
                  />
                  <button
                    onClick={() => handleAdvance('Discussed')}
                    disabled={advancing}
                    className="btn-primary text-xs"
                  >
                    {advancing ? 'Saving…' : 'Mark Discussed'}
                  </button>
                </div>
              )}

              {/* IDS advance — Discussed → Solved (admin only) */}
              {issue.status === 'Discussed' && canSolve && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Resolve Issue</p>
                  <textarea
                    className="input text-sm w-full resize-none"
                    rows={2}
                    placeholder="Solution notes…"
                    value={solutionNotes}
                    onChange={e => setSolutionNotes(e.target.value)}
                  />
                  <button
                    onClick={() => handleAdvance('Solved')}
                    disabled={advancing || !solutionNotes.trim()}
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {advancing ? 'Saving…' : 'Mark Solved'}
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end">
                  <button
                    onClick={() => onDelete(issue.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main EOS Page ──────────────────────────────────────────────────────────────

export default function EOS() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState('rocks')

  // Rocks
  const [rocks, setRocks] = useState([])
  const [rocksLoading, setRocksLoading] = useState(true)
  const [rockModal, setRockModal] = useState(false)
  const [newRock, setNewRock] = useState({
    title: '', description: '', rock_type: 'company',
    owner_id: '', quarter: getCurrentQuarter(), due_date: '',
  })
  const [savingRock, setSavingRock] = useState(false)

  // Todos
  const [todos, setTodos] = useState([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [savingTodo, setSavingTodo] = useState(false)
  const [todoUserId, setTodoUserId] = useState(user?.id || '')

  // Issues
  const [issues, setIssues] = useState([])
  const [solvedIssues, setSolvedIssues] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(true)
  const [solvedExpanded, setSolvedExpanded] = useState(false)
  const [issueModal, setIssueModal] = useState(false)
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'Medium', rock_id: '' })
  const [savingIssue, setSavingIssue] = useState(false)

  // Shared
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (isAdmin) api.get('/api/users/reps').then(setUsers).catch(console.error)
  }, [isAdmin])

  const fetchRocks = async () => {
    setRocksLoading(true)
    const data = await api.get('/api/rocks').catch(() => [])
    setRocks(data || [])
    setRocksLoading(false)
  }

  const fetchTodos = async (uid) => {
    setTodosLoading(true)
    const query = isAdmin && uid && uid !== user?.id ? `?user_id=${uid}` : ''
    const data = await api.get(`/api/todos${query}`).catch(() => [])
    setTodos(data || [])
    setTodosLoading(false)
  }

  const fetchIssues = async () => {
    setIssuesLoading(true)
    const [active, solved] = await Promise.all([
      api.get('/api/issues').catch(() => []),
      api.get('/api/issues?status=Solved').catch(() => []),
    ])
    setIssues(active || [])
    setSolvedIssues(solved || [])
    setIssuesLoading(false)
  }

  useEffect(() => { fetchRocks() }, [])
  useEffect(() => { fetchTodos(todoUserId) }, [todoUserId])
  useEffect(() => { fetchIssues() }, [])

  // ── Rock actions ────────────────────────────────────────────────────────────

  const handleCreateRock = async () => {
    if (!newRock.title || !newRock.quarter) return
    setSavingRock(true)
    await api.post('/api/rocks', {
      ...newRock,
      owner_id: newRock.rock_type === 'company' ? null : (newRock.owner_id || user?.id),
    }).catch(console.error)
    await fetchRocks()
    setRockModal(false)
    setNewRock({ title: '', description: '', rock_type: 'company', owner_id: '', quarter: getCurrentQuarter(), due_date: '' })
    setSavingRock(false)
  }

  const handleStatusChange = async (rockId, status) => {
    await api.put(`/api/rocks/${rockId}`, { status }).catch(console.error)
    setRocks(r => r.map(rock => rock.id === rockId ? { ...rock, status } : rock))
  }

  const handleMilestoneToggle = async (rockId, milestoneId, completed) => {
    const data = await api.put(`/api/rocks/${rockId}/milestones/${milestoneId}`, { completed }).catch(() => null)
    if (data) {
      setRocks(r => r.map(rock =>
        rock.id === rockId
          ? { ...rock, milestones: rock.milestones.map(m => m.id === milestoneId ? data : m) }
          : rock
      ))
    }
  }

  const handleAddMilestone = async (rockId, description) => {
    const data = await api.post(`/api/rocks/${rockId}/milestones`, { description }).catch(() => null)
    if (data) {
      setRocks(r => r.map(rock =>
        rock.id === rockId
          ? { ...rock, milestones: [...(rock.milestones || []), data] }
          : rock
      ))
    }
  }

  const handleDeleteRock = async (rockId) => {
    await api.delete(`/api/rocks/${rockId}`).catch(console.error)
    setRocks(r => r.filter(rock => rock.id !== rockId))
  }

  // ── Todo actions ────────────────────────────────────────────────────────────

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return
    setSavingTodo(true)
    const body = { description: newTodo.trim() }
    if (isAdmin && todoUserId && todoUserId !== user?.id) body.owner_id = todoUserId
    const data = await api.post('/api/todos', body).catch(() => null)
    if (data) setTodos(t => [...t, data])
    setNewTodo('')
    setSavingTodo(false)
  }

  const handleToggleTodo = async (id, completed) => {
    const data = await api.put(`/api/todos/${id}`, { completed }).catch(() => null)
    if (data) setTodos(t => t.map(todo => todo.id === id ? data : todo))
  }

  const handleDeleteTodo = async (id) => {
    await api.delete(`/api/todos/${id}`).catch(console.error)
    setTodos(t => t.filter(todo => todo.id !== id))
  }

  // ── Issue actions ───────────────────────────────────────────────────────────

  const handleCreateIssue = async () => {
    if (!newIssue.title) return
    setSavingIssue(true)
    const data = await api.post('/api/issues', {
      ...newIssue,
      rock_id: newIssue.rock_id || undefined,
    }).catch(() => null)
    if (data) setIssues(i => [data, ...i])
    setIssueModal(false)
    setNewIssue({ title: '', description: '', priority: 'Medium', rock_id: '' })
    setSavingIssue(false)
  }

  const handleIssueStatusChange = async (issueId, body) => {
    const data = await api.put(`/api/issues/${issueId}`, body).catch(() => null)
    if (data) {
      if (body.status === 'Solved') {
        setIssues(i => i.filter(issue => issue.id !== issueId))
        setSolvedIssues(i => [{ ...data, raised_by_name: data.raised_by_name }, ...i])
      } else {
        setIssues(i => i.map(issue => issue.id === issueId ? { ...issue, ...data } : issue))
      }
    }
  }

  const handleDeleteIssue = async (issueId) => {
    await api.delete(`/api/issues/${issueId}`).catch(console.error)
    setIssues(i => i.filter(issue => issue.id !== issueId))
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const companyRocks = rocks.filter(r => r.rock_type === 'company')
  const myRocks      = rocks.filter(r => r.rock_type !== 'company' && r.owner_id === user?.id)
  const teamRocks    = isAdmin ? rocks.filter(r => r.rock_type !== 'company') : []

  const doneTodos  = todos.filter(t => t.completed).length
  const totalTodos = todos.length

  const identifiedIssues = issues.filter(i => i.status === 'Identified')
  const discussedIssues  = issues.filter(i => i.status === 'Discussed')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-bold text-gray-900">EOS</h1>
        <p className="text-sm text-gray-400 mt-0.5">Rocks · Weekly To-Dos · Issues</p>
      </motion.div>

      {/* Suggestions */}
      <SuggestionsPanel />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Rocks ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rocks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-6">

          {/* Company Rocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Company Rocks</h2>
              {isAdmin && (
                <button
                  onClick={() => { setRockModal(true); setNewRock(r => ({ ...r, rock_type: 'company' })) }}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add Rock
                </button>
              )}
            </div>
            {rocksLoading ? (
              <div className="text-sm text-gray-400 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading…</div>
            ) : companyRocks.length === 0 ? (
              <div className="card p-4 text-sm text-gray-400">No company rocks yet.</div>
            ) : (
              companyRocks.map(rock => (
                <RockCard
                  key={rock.id}
                  rock={rock}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onStatusChange={handleStatusChange}
                  onMilestoneToggle={handleMilestoneToggle}
                  onAddMilestone={handleAddMilestone}
                  onDelete={handleDeleteRock}
                />
              ))
            )}
          </div>

          {/* My Rocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">My Rocks</h2>
              <button
                onClick={() => {
                  setRockModal(true)
                  setNewRock(r => ({
                    ...r,
                    rock_type: isAdmin ? 'individual' : 'personal',
                    owner_id: user?.id,
                  }))
                }}
                className="text-xs text-[#06babe] hover:underline flex items-center gap-1"
              >
                <Plus size={11} /> {isAdmin ? 'Add Individual Rock' : 'Add Personal Rock'}
              </button>
            </div>
            {!rocksLoading && myRocks.length === 0 ? (
              <div className="card p-4 text-sm text-gray-400">No personal rocks yet.</div>
            ) : (
              myRocks.map(rock => (
                <RockCard
                  key={rock.id}
                  rock={rock}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onStatusChange={handleStatusChange}
                  onMilestoneToggle={handleMilestoneToggle}
                  onAddMilestone={handleAddMilestone}
                  onDelete={handleDeleteRock}
                />
              ))
            )}
          </div>

          {/* Team Rocks (admin: all reps' rocks) */}
          {isAdmin && teamRocks.filter(r => r.owner_id !== user?.id).length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Team Rocks</h2>
              {teamRocks.filter(r => r.owner_id !== user?.id).map(rock => (
                <RockCard
                  key={rock.id}
                  rock={rock}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onStatusChange={handleStatusChange}
                  onMilestoneToggle={handleMilestoneToggle}
                  onAddMilestone={handleAddMilestone}
                  onDelete={handleDeleteRock}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Weekly To-Dos ────────────────────────────────────────────────────── */}
      {activeTab === 'todos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-4">

          {/* Admin: user selector */}
          {isAdmin && users.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Viewing:</span>
              <select
                className="input text-sm w-48"
                value={todoUserId}
                onChange={e => setTodoUserId(e.target.value)}
              >
                <option value={user?.id}>My To-Dos</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Progress bar */}
          {totalTodos > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">This week's progress</span>
                <span className="text-sm font-bold text-[#06babe]">{doneTodos}/{totalTodos}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#06babe]"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Todo list */}
          <div className="card p-4 space-y-3">
            {todosLoading ? (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Loading…
              </div>
            ) : todos.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No to-dos this week — add one below!</p>
            ) : (
              todos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      todo.completed
                        ? 'bg-[#06babe] border-[#06babe] text-white'
                        : 'border-gray-300 hover:border-[#06babe]'
                    }`}
                  >
                    {todo.completed && <Check size={11} strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {todo.description}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {todo.rock_title && (
                        <span className="text-xs text-[#06babe] flex items-center gap-0.5">
                          <Link2 size={9} /> {todo.rock_title}
                        </span>
                      )}
                      {todo.carried_over && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          ↩ Carried over
                        </span>
                      )}
                      {isAdmin && todo.owner_name && todo.owner_id !== user?.id && (
                        <span className="text-xs text-gray-400">{todo.owner_name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 mt-0.5 shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}

            {/* Add todo */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                className="input text-sm flex-1"
                placeholder="Add a to-do… (press Enter)"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
              />
              <button
                onClick={handleAddTodo}
                disabled={savingTodo || !newTodo.trim()}
                className="btn-primary text-xs px-3 disabled:opacity-50"
              >
                {savingTodo ? '…' : <Plus size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Issues List ──────────────────────────────────────────────────────── */}
      {activeTab === 'issues' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-6">

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {issues.length > 0 ? `${issues.length} open ${issues.length === 1 ? 'issue' : 'issues'}` : 'No open issues'}
            </span>
            <button
              onClick={() => setIssueModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={12} /> Raise an Issue
            </button>
          </div>

          {issuesLoading ? (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {/* Identified */}
              {identifiedIssues.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Identified ({identifiedIssues.length})
                  </h2>
                  {identifiedIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isAdmin={isAdmin}
                      currentUser={user}
                      onStatusChange={handleIssueStatusChange}
                      onDelete={handleDeleteIssue}
                    />
                  ))}
                </div>
              )}

              {/* Discussed */}
              {discussedIssues.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Discussed ({discussedIssues.length})
                  </h2>
                  {discussedIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isAdmin={isAdmin}
                      currentUser={user}
                      onStatusChange={handleIssueStatusChange}
                      onDelete={handleDeleteIssue}
                    />
                  ))}
                </div>
              )}

              {issues.length === 0 && (
                <div className="card p-6 text-center">
                  <CheckCircle size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No open issues — great work!</p>
                </div>
              )}

              {/* Solved (collapsible) */}
              {solvedIssues.length > 0 && (
                <div>
                  <button
                    onClick={() => setSolvedExpanded(v => !v)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 hover:text-gray-600 transition-colors"
                  >
                    {solvedExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Solved ({solvedIssues.length})
                  </button>
                  {solvedExpanded && solvedIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      isAdmin={isAdmin}
                      currentUser={user}
                      onStatusChange={handleIssueStatusChange}
                      onDelete={handleDeleteIssue}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ── Add Rock Modal ───────────────────────────────────────────────────── */}
      {rockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{isAdmin ? 'Add Rock' : 'Add Personal Rock'}</h2>
              <button onClick={() => setRockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="label">Rock Type</label>
                  <select
                    className="input"
                    value={newRock.rock_type}
                    onChange={e => setNewRock(r => ({ ...r, rock_type: e.target.value }))}
                  >
                    <option value="company">Company Rock (visible to all)</option>
                    <option value="individual">Individual Rock (assign to rep)</option>
                    <option value="personal">Personal Rock (myself)</option>
                  </select>
                </div>
              )}
              {isAdmin && newRock.rock_type === 'individual' && (
                <div>
                  <label className="label">Assign to Rep</label>
                  <select
                    className="input"
                    value={newRock.owner_id}
                    onChange={e => setNewRock(r => ({ ...r, owner_id: e.target.value }))}
                  >
                    <option value="">— Select Rep —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Rock Title</label>
                <input
                  className="input"
                  placeholder="e.g. Grow Kings Highway revenue by 20%"
                  value={newRock.title}
                  onChange={e => setNewRock(r => ({ ...r, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="What does success look like?"
                  value={newRock.description}
                  onChange={e => setNewRock(r => ({ ...r, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quarter</label>
                  <input
                    className="input"
                    placeholder={getCurrentQuarter()}
                    value={newRock.quarter}
                    onChange={e => setNewRock(r => ({ ...r, quarter: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Due Date (optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={newRock.due_date}
                    onChange={e => setNewRock(r => ({ ...r, due_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setRockModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleCreateRock}
                disabled={savingRock || !newRock.title || !newRock.quarter}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {savingRock ? 'Saving…' : 'Create Rock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise Issue Modal ─────────────────────────────────────────────────── */}
      {issueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Raise an Issue</h2>
              <button onClick={() => setIssueModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Issue Title</label>
                <input
                  className="input"
                  placeholder="Briefly describe the issue…"
                  value={newIssue.title}
                  onChange={e => setNewIssue(i => ({ ...i, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="More context, root cause ideas…"
                  value={newIssue.description}
                  onChange={e => setNewIssue(i => ({ ...i, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input"
                    value={newIssue.priority}
                    onChange={e => setNewIssue(i => ({ ...i, priority: e.target.value }))}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="label">Link to Rock (optional)</label>
                  <select
                    className="input"
                    value={newIssue.rock_id}
                    onChange={e => setNewIssue(i => ({ ...i, rock_id: e.target.value }))}
                  >
                    <option value="">— None —</option>
                    {rocks.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setIssueModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleCreateIssue}
                disabled={savingIssue || !newIssue.title}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {savingIssue ? 'Raising…' : 'Raise Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
