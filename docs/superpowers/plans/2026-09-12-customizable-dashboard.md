# Customizable Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each user show/hide and reorder widgets on their Rep Dashboard and (independently) the admin Command Center, persisted server-side, with today's layout as the default for anyone who never customizes.

**Architecture:** A new `dashboard_layouts` table + 3 REST endpoints store an ordered `{id, visible}[]` per user per dashboard type. The frontend turns each dashboard's hardcoded JSX sequence into an array of `{id, label, span, render}` widget entries; a shared hook fetches/reconciles the saved order against that array, and a shared `EditLayoutModal` lets the user check/uncheck and reorder (drag on desktop, up/down buttons everywhere — HTML5 drag doesn't fire on touch, same known limitation as this app's existing Pipeline kanban).

**Tech Stack:** Express + `pg` (raw SQL) on the backend; React + Tailwind on the frontend. No test framework exists in this repo (`npm test` is a stub on both sides) — every task's verification step is a real `curl` command (backend) or a concrete manual/Playwright check (frontend), matching how the rest of this codebase is verified.

**Spec:** `Frontend/docs/superpowers/specs/2026-09-12-customizable-dashboard-design.md`

## Global Constraints

- Server-side persistence, per user, per dashboard type (`rep` or `admin`) — from spec.
- No saved row = hardcoded default (current layout, current order, all visible) — from spec.
- Widget `span` (`full` or `third`) is a fixed layout hint, not user-editable — only visibility and order are — from spec.
- Reconciliation: saved widgets no longer in the registry are dropped; registry widgets missing from a saved layout are appended, visible — from spec.
- Brand teal for any new UI text/links must use the accessible `#057a7e` (not `#06babe`), matching this session's earlier contrast fix — established codebase convention as of 2026-09-11.

---

### Task 1: Backend — `dashboard_layouts` table and API

**Files:**
- Create: `Backend/scripts/v18-dashboard-layout-migration.sql`
- Create: `Backend/src/routes/dashboardLayout.js`
- Modify: `Backend/src/app.js` (add require + mount)

**Interfaces:**
- Produces: `GET /api/dashboard-layout?type=rep|admin` → `200 { ...widgets array... }` or `200 null`. `PUT /api/dashboard-layout` (body `{ dashboard_type, widgets }`) → `200 { ...saved widgets... }`. `DELETE /api/dashboard-layout?type=rep|admin` → `200 { success: true }`. All three `auth`-gated (any logged-in user; scoped to `req.user.id`).

- [ ] **Step 1: Write the migration**

```sql
-- Backend/scripts/v18-dashboard-layout-migration.sql
-- Per-user, per-dashboard widget layout (show/hide + order) for the
-- customizable Dashboard feature. No row = use the hardcoded frontend
-- default (current layout, everything visible, current order).
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  dashboard_type text NOT NULL CHECK (dashboard_type IN ('rep', 'admin')),
  widgets jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dashboard_type)
);
```

- [ ] **Step 2: Apply the migration**

Run (from `Backend/`): a one-off Node script using the existing `pg` pool, matching how every other migration in this session was applied (no migration runner exists in this repo — see `Backend/scripts/*.sql`, applied by hand):

```bash
node -e "
const fs = require('fs');
const db = require('./src/config/db');
db.query(fs.readFileSync('./scripts/v18-dashboard-layout-migration.sql', 'utf8'))
  .then(() => db.query(\`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='dashboard_layouts' ORDER BY ordinal_position\`))
  .then(({rows}) => { console.log(rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
"
```

Expected: prints the 5 columns (`id`, `user_id`, `dashboard_type`, `widgets`, `updated_at`) — confirms the table exists.

- [ ] **Step 3: Write the route**

```js
// Backend/src/routes/dashboardLayout.js
const express = require('express')
const db = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

const VALID_TYPES = ['rep', 'admin']

// GET /api/dashboard-layout?type=rep|admin — the caller's saved widget
// order for that dashboard, or null if they've never customized it (the
// frontend falls back to its hardcoded default in that case).
router.get('/', auth, async (req, res, next) => {
  try {
    const { type } = req.query
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'type must be rep or admin' })
    const { rows } = await db.query(
      `SELECT widgets FROM dashboard_layouts WHERE user_id=$1 AND dashboard_type=$2`,
      [req.user.id, type]
    )
    res.json(rows[0]?.widgets || null)
  } catch (err) { next(err) }
})

// PUT /api/dashboard-layout — body { dashboard_type, widgets: [{id, visible}, ...] }
router.put('/', auth, async (req, res, next) => {
  try {
    const { dashboard_type, widgets } = req.body
    if (!VALID_TYPES.includes(dashboard_type)) return res.status(400).json({ error: 'dashboard_type must be rep or admin' })
    if (!Array.isArray(widgets)) return res.status(400).json({ error: 'widgets must be an array' })
    const { rows } = await db.query(
      `INSERT INTO dashboard_layouts (user_id, dashboard_type, widgets, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (user_id, dashboard_type) DO UPDATE SET widgets=$3, updated_at=NOW()
       RETURNING widgets`,
      [req.user.id, dashboard_type, JSON.stringify(widgets)]
    )
    res.json(rows[0].widgets)
  } catch (err) { next(err) }
})

// DELETE /api/dashboard-layout?type=rep|admin — reset to the frontend's
// hardcoded default by removing the saved row entirely.
router.delete('/', auth, async (req, res, next) => {
  try {
    const { type } = req.query
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'type must be rep or admin' })
    await db.query(`DELETE FROM dashboard_layouts WHERE user_id=$1 AND dashboard_type=$2`, [req.user.id, type])
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Step 4: Mount the route**

In `Backend/src/app.js`, add near the other route requires (after line 23, `const taskRoutes = require('./routes/tasks')`):

```js
const dashboardLayoutRoutes = require('./routes/dashboardLayout')
```

And near the other `app.use('/api/tasks', ...)` line (after it):

```js
app.use('/api/dashboard-layout', dashboardLayoutRoutes)
```

- [ ] **Step 5: Verify with curl**

Start the backend (`npm run dev` from `Backend/`). Mint a token the same way this session has throughout (via a short Node script using `jsonwebtoken` + the real `JWT_SECRET`, signing a real user row), then:

```bash
TOKEN="<minted token>"

# 1. No saved layout yet → null
curl -s "http://localhost:4000/api/dashboard-layout?type=rep" -H "Authorization: Bearer $TOKEN"
# Expected: null

# 2. Save a layout
curl -s -X PUT http://localhost:4000/api/dashboard-layout -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"dashboard_type":"rep","widgets":[{"id":"kpiCards","visible":true},{"id":"tasksForToday","visible":false}]}'
# Expected: {"widgets... echoed back

# 3. Fetch again → the saved layout
curl -s "http://localhost:4000/api/dashboard-layout?type=rep" -H "Authorization: Bearer $TOKEN"
# Expected: the same array from step 2

# 4. Reset
curl -s -X DELETE "http://localhost:4000/api/dashboard-layout?type=rep" -H "Authorization: Bearer $TOKEN"
# Expected: {"success":true}

# 5. Fetch again → back to null
curl -s "http://localhost:4000/api/dashboard-layout?type=rep" -H "Authorization: Bearer $TOKEN"
# Expected: null
```

- [ ] **Step 6: Commit**

```bash
cd Backend
git add scripts/v18-dashboard-layout-migration.sql src/routes/dashboardLayout.js src/app.js
git commit -m "$(cat <<'EOF'
Add dashboard_layouts table and API for per-user widget customization

Backs the customizable Dashboard feature: each user can save an
ordered show/hide list per dashboard type (rep/admin). No saved row
means the frontend's hardcoded default layout applies.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Frontend — `useDashboardLayout` hook

**Files:**
- Create: `Frontend/src/hooks/useDashboardLayout.js`

**Interfaces:**
- Consumes: `api` from `Frontend/src/lib/api.js` (`.get`, `.put`, `.delete` — all confirmed present, see `api.js`).
- Produces: `useDashboardLayout(type, registry)` → `{ order, loaded, visibleOrdered, save, reset }` where:
  - `type` is `'rep'` or `'admin'`.
  - `registry` is an array of `{ id, label, span, render }` (Task 3/4 define these).
  - `order` is the full `{id, visible}[]` (including hidden ones) — what the edit panel needs.
  - `visibleOrdered` is the subset of `registry` entries that are visible, in saved order — what the dashboard renders.
  - `save(newOrder)` persists and updates state; `reset()` deletes the saved row and reverts to the registry's natural order.

- [ ] **Step 1: Write the hook**

```js
// Frontend/src/hooks/useDashboardLayout.js
import { useEffect, useState } from 'react'
import api from '../lib/api'

// Reconciles a saved {id, visible}[] against the current widget registry:
// - widgets in both: keep the saved visibility/order
// - registry widgets missing from the save (added to the app later):
//   appended at the end, visible
// - saved widgets no longer in the registry (removed from the app later):
//   dropped
function reconcile(saved, registry) {
  if (!saved) return registry.map(w => ({ id: w.id, visible: true }))
  const registryIds = new Set(registry.map(w => w.id))
  const kept = saved.filter(s => registryIds.has(s.id))
  const keptIds = new Set(kept.map(s => s.id))
  const added = registry.filter(w => !keptIds.has(w.id)).map(w => ({ id: w.id, visible: true }))
  return [...kept, ...added]
}

export default function useDashboardLayout(type, registry) {
  const [order, setOrder] = useState(() => registry.map(w => ({ id: w.id, visible: true })))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get(`/api/dashboard-layout?type=${type}`)
      .then(saved => { if (!cancelled) setOrder(reconcile(saved, registry)) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
    // registry is a stable module-level array per dashboard (defined
    // outside the component), so it's intentionally not a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const save = async (newOrder) => {
    setOrder(newOrder)
    await api.put('/api/dashboard-layout', { dashboard_type: type, widgets: newOrder })
  }

  const reset = async () => {
    const def = registry.map(w => ({ id: w.id, visible: true }))
    setOrder(def)
    await api.delete(`/api/dashboard-layout?type=${type}`)
  }

  const visibleOrdered = order
    .filter(o => o.visible)
    .map(o => registry.find(w => w.id === o.id))
    .filter(Boolean)

  return { order, loaded, visibleOrdered, save, reset }
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd Frontend && npm run build
```

Expected: builds clean (this file isn't wired into any page yet, so this only checks for syntax errors — full behavioral verification happens in Task 3/4 once it's actually used).

- [ ] **Step 3: Commit**

```bash
cd Frontend
git add src/hooks/useDashboardLayout.js
git commit -m "$(cat <<'EOF'
Add useDashboardLayout hook for per-user widget show/hide + order

Fetches and reconciles a saved dashboard layout against a widget
registry; not wired into any page yet (next tasks do that).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Frontend — shared `EditLayoutModal` component

**Files:**
- Create: `Frontend/src/components/EditLayoutModal.jsx`

**Interfaces:**
- Consumes: `AnimatedModal` from `Frontend/src/components/AnimatedModal.jsx` (props: `onClose`, `header`, `footer`, `maxWidth`, `children` — confirmed from this session's earlier a11y fix to that component).
- Produces: `<EditLayoutModal registry={...} order={...} onSave={fn} onReset={fn} onClose={fn} />`. `registry` is `{id, label, span, render}[]` (for labels only — `span`/`render` unused here). `order` is the hook's `order` value. `onSave(newOrder)` and `onReset()` are expected to be the hook's `save`/`reset` (or wrappers around them) — this component doesn't call the API directly, it only produces the new `{id, visible}[]` array and hands it back.

- [ ] **Step 1: Write the component**

```jsx
// Frontend/src/components/EditLayoutModal.jsx
import { useState } from 'react'
import { X, GripVertical, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import AnimatedModal from './AnimatedModal'

// Shared show/hide + reorder editor for a dashboard's widget layout — used
// by both the Rep Dashboard and the admin Command Center. Up/down buttons
// are the primary reorder mechanism since they work on touch; each row is
// also `draggable` as a desktop bonus, matching the same native HTML5
// drag-and-drop Pipeline.jsx already uses elsewhere in this app (which has
// the same documented touch limitation).
export default function EditLayoutModal({ registry, order, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState(order)
  const [dragId, setDragId] = useState(null)
  const labelFor = id => registry.find(w => w.id === id)?.label || id

  const move = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= draft.length) return
    const next = [...draft]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft(next)
  }

  const toggle = (id) => {
    setDraft(draft.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  const onDrop = (index) => {
    if (dragId === null) return
    const from = draft.findIndex(w => w.id === dragId)
    if (from === -1 || from === index) { setDragId(null); return }
    const next = [...draft]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    setDraft(next)
    setDragId(null)
  }

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="sm"
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Edit Layout</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-6 py-4">
          <button onClick={() => onReset()} className="text-slate-500 hover:underline text-sm font-medium flex items-center gap-1.5 mr-auto">
            <RotateCcw size={13} /> Reset to Default
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn-primary">Save</button>
        </div>
      }
    >
      <div className="p-6">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Check to show a widget. Drag on desktop, or use the arrows, to reorder.
        </p>
        <div className="space-y-1.5">
          {draft.map((w, i) => (
            <div
              key={w.id}
              draggable
              onDragStart={() => setDragId(w.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
            >
              <GripVertical size={14} className="text-slate-300 dark:text-slate-600 cursor-grab flex-shrink-0 hidden sm:block" />
              <input type="checkbox" checked={w.visible} onChange={() => toggle(w.id)} className="flex-shrink-0" />
              <span className={`flex-1 text-sm ${w.visible ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                {labelFor(w.id)}
              </span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 p-0.5">
                <ChevronUp size={15} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === draft.length - 1} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 p-0.5">
                <ChevronDown size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AnimatedModal>
  )
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd Frontend && npm run build
```

Expected: builds clean (not wired into any page yet).

- [ ] **Step 3: Commit**

```bash
cd Frontend
git add src/components/EditLayoutModal.jsx
git commit -m "$(cat <<'EOF'
Add shared EditLayoutModal for dashboard widget customization

Show/hide checkboxes + up/down reorder buttons (touch-safe) with
drag-and-drop as a desktop bonus, matching Pipeline.jsx's existing
native-HTML5-drag pattern. Not wired into any page yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Frontend — wire the Rep Dashboard to widgets + the hook + the modal

**Files:**
- Modify: `Frontend/src/pages/Dashboard.jsx` (the `RepDashboard` function only, lines 218–333 in the file as of this plan — search for `function RepDashboard` to confirm current line numbers before editing, since Task 5 will also touch this file and line numbers may have shifted)

**Interfaces:**
- Consumes: `useDashboardLayout` (Task 2), `EditLayoutModal` (Task 3).
- Produces: nothing new consumed by later tasks — Task 5 mirrors this pattern independently for `AdminDashboard`, it doesn't import anything from `RepDashboard`.

- [ ] **Step 1: Add imports**

At the top of `Frontend/src/pages/Dashboard.jsx`, add:

```js
import useDashboardLayout from '../hooks/useDashboardLayout'
import EditLayoutModal from '../components/EditLayoutModal'
import { Settings2 } from 'lucide-react'
```

(Add `Settings2` to the existing `lucide-react` import block rather than a second import statement — match the existing single multi-line `import { ... } from 'lucide-react'` already in this file.)

- [ ] **Step 2: Define `REP_WIDGETS` and rewrite `RepDashboard`'s return**

Replace the entire `RepDashboard` function body from `return (` through its closing `)` (currently the JSX that starts with `<div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto space-y-6">` and ends with the `{/* Recent Leads */}` block) with a widget-registry-driven version. The widget bodies below are the **exact existing JSX**, unchanged — only the wrapping structure (array + map instead of a flat sequence) is new:

```jsx
  const REP_WIDGETS = [
    {
      id: 'tasksForToday', label: 'Tasks for Today', span: 'full',
      render: () => <TasksForToday />,
    },
    {
      id: 'kpiCards', label: 'KPI Cards', span: 'full',
      render: () => (
        loading ? <SkeletonKpiCards count={4} /> : (
          <div data-tour="dashboard-kpi-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {kpiCards.map((card, i) => (
              <KpiCard key={card.label} {...card} delay={i * 0.08} />
            ))}
          </div>
        )
      ),
    },
    {
      id: 'suggestions', label: 'Your 1% This Week', span: 'full',
      render: () => (
        !loading && summary?.suggestions?.length > 0 && (
          <motion.div
            data-tour="dashboard-suggestions"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
            className="card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-[#06babe]" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your 1% This Week</h2>
              {summary.tier && (
                <span className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_META[summary.tier]?.bg} ${TIER_META[summary.tier]?.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${TIER_META[summary.tier]?.dot}`} />
                  {TIER_META[summary.tier]?.label}
                </span>
              )}
            </div>
            <ul className="space-y-2">
              {summary.suggestions.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${TIER_META[summary.tier]?.dot || 'bg-[#06babe]'}`} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )
      ),
    },
    {
      id: 'recentLeads', label: 'My Recent Leads', span: 'full',
      render: () => (
        !loading && summary?.recent_leads?.length > 0 && (
          <motion.div
            data-tour="dashboard-recent-leads"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.35 }}
            className="card p-5"
          >
            <div className="section-header">
              <h2 className="section-title">My Recent Leads</h2>
              <Link to="/leads" className="text-xs text-[#057a7e] hover:underline font-medium">View all →</Link>
            </div>
            <div className="space-y-2.5">
              {summary.recent_leads.map((lead, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-3 text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                    {(lead.doctor_name || '?').split(' ').pop()[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                    <p className="text-xs text-slate-400">{lead.clinic_name || lead.case_interest || '—'}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_CLASSES[lead.status] || ''}`}>
                    {lead.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      ),
    },
  ]

  const { order, loaded, visibleOrdered, save, reset } = useDashboardLayout('rep', REP_WIDGETS)
  const [editingLayout, setEditingLayout] = useState(false)

  return (
    <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 italic">{motivational}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingLayout(true)} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Settings2 size={14} /> Edit Layout
          </button>
          <button onClick={fetchAll} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </motion.div>

      {loaded && visibleOrdered.map(w => <div key={w.id}>{w.render()}</div>)}

      {editingLayout && (
        <EditLayoutModal
          registry={REP_WIDGETS}
          order={order}
          onSave={async (newOrder) => { await save(newOrder); setEditingLayout(false) }}
          onReset={async () => { await reset(); setEditingLayout(false) }}
          onClose={() => setEditingLayout(false)}
        />
      )}
    </div>
  )
}
```

Note: this removes the standalone `{/* Tasks for Today */}`, `{/* KPI Cards */}`, `{/* Your 1% This Week */}`, and `{/* Recent Leads */}` JSX blocks from their old fixed positions — they now live inside `REP_WIDGETS`' `render` functions instead, and the final `}` above closes `RepDashboard` itself (the old closing `}` for the function stays).

- [ ] **Step 2: Verify it builds**

```bash
cd Frontend && npm run build
```

Expected: builds clean, no unused-variable warnings for anything removed (if `SkeletonCard` or similar becomes unused, remove that import too — check `grep -n "SkeletonCard" src/pages/Dashboard.jsx` returns a match outside the import line; if not, drop it from the import).

- [ ] **Step 3: Manual verification (Playwright or a real browser)**

Log in as a `sales_rep` (e.g., `williama@aimdentallab.com` — see this session's demo-credentials memory, or mint a token the same way prior tasks in this session did), navigate to `/dashboard`, and confirm:

1. The page looks identical to before this change (Tasks for Today, KPI Cards, Your 1% This Week, My Recent Leads, in that order) — this is the default-layout-unchanged requirement from the spec.
2. Click "Edit Layout" → modal opens listing all 4 widgets, checked.
3. Uncheck "My Recent Leads", click Save → modal closes, "My Recent Leads" no longer renders.
4. Reload the page → "My Recent Leads" is still hidden (proves persistence — `GET /api/dashboard-layout?type=rep` is returning the saved row).
5. Open "Edit Layout" again, use the down-arrow to move "Tasks for Today" below "KPI Cards", Save → the dashboard now shows KPI Cards first.
6. Open "Edit Layout" → "Reset to Default" → dashboard returns to the original order with all 4 widgets visible.

- [ ] **Step 4: Commit**

```bash
cd Frontend
git add src/pages/Dashboard.jsx
git commit -m "$(cat <<'EOF'
Make the Rep Dashboard's widgets show/hide + reorderable

Wires useDashboardLayout + EditLayoutModal into RepDashboard. Widget
bodies are unchanged JSX, now driven by a registry array instead of a
fixed sequence, so the default (no saved layout) renders identically
to before this change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Frontend — wire the Admin Dashboard the same way (mixed full/third spans)

**Files:**
- Modify: `Frontend/src/pages/Dashboard.jsx` (the `AdminDashboard` function only — search for `function AdminDashboard` to confirm current line numbers, since Task 4 shifted everything below it)

**Interfaces:**
- Consumes: `useDashboardLayout` (Task 2), `EditLayoutModal` (Task 3) — same imports Task 4 already added at the top of the file, no new imports needed here except possibly none (re-check: `Settings2` already imported by Task 4).

- [ ] **Step 1: Define `ADMIN_WIDGETS` and rewrite `AdminDashboard`'s return**

Same technique as Task 4: each existing JSX block (KPI Cards, Rep Performance, Team Goals, Intake Feed, Active Case Pipeline, and the three cards from the bottom 3-column grid — Revenue by Brand, Cold Leads, Recent Leads) becomes a `render` function in an `ADMIN_WIDGETS` array, unchanged internally. The three bottom-row cards get `span: 'third'`; everything else is `span: 'full'`. Replace `AdminDashboard`'s full return statement (from `<div className="px-4 py-5 sm:p-6 max-w-6xl mx-auto space-y-6">` through the closing of the bottom 3-column grid `</div>`, plus the existing `{showTaskModal && (...)}` block, which stays but moves to the end unchanged) with:

```jsx
  const ADMIN_WIDGETS = [
    {
      id: 'kpiCards', label: 'KPI Cards', span: 'full',
      render: () => (
        loading ? <SkeletonKpiCards count={4} /> : (
          <div data-tour="admin-kpi-cards" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpiCards.map((card, i) => (
              <KpiCard key={card.label} {...card} delay={i * 0.08} />
            ))}
          </div>
        )
      ),
    },
    {
      id: 'repPerformance', label: 'Rep Performance', span: 'full',
      render: () => (
        !loading && teamStats.length > 0 && (
          <motion.div
            data-tour="rep-performance-table"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}
            className="card p-5"
          >
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-[#06babe]" />
                <h2 className="section-title">Rep Performance</h2>
              </div>
              <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {['week', 'month', 'quarter', 'year'].map(p => (
                  <button
                    key={p}
                    onClick={() => setTeamPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                      teamPeriod === p
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto -mx-1">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Rep', 'Leads', 'Wins', 'Proposals', 'Conv. Rate', 'Clients', 'Cases', 'Sales Value'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map(({ rep, clients_count, ...periods }) => {
                    const s = periods[teamPeriod] || {}
                    return (
                      <tr key={rep.id} onClick={() => navigate(`/reps/${rep.id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(rep.name || rep.email || '?')[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.name || rep.email}</span>
                          </div>
                        </td>
                        <td className="text-slate-600 dark:text-slate-400">{s.leads_assigned ?? 0}</td>
                        <td><span className="font-bold text-emerald-600">{s.leads_won ?? 0}</span></td>
                        <td className="text-slate-600 dark:text-slate-400">{s.proposals_sent ?? 0}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${(s.conversion_rate ?? 0) >= 30 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                              {s.conversion_rate ?? 0}%
                            </span>
                            {(s.conversion_rate ?? 0) >= 30
                              ? <ArrowUpRight size={12} className="text-emerald-500" />
                              : <ArrowDownRight size={12} className="text-red-400" />}
                          </div>
                        </td>
                        <td className="text-slate-600 dark:text-slate-400">{clients_count ?? 0}</td>
                        <td className="text-slate-600 dark:text-slate-400">{s.cases_count ?? 0}</td>
                        <td className="font-bold text-emerald-600">${Number(s.sales_value ?? 0).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {teamStats.map(({ rep, clients_count, ...periods }) => {
                const s = periods[teamPeriod] || {}
                return (
                  <div key={rep.id} onClick={() => navigate(`/reps/${rep.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer active:opacity-70 transition-opacity">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(rep.name || rep.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{rep.name || rep.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.leads_assigned ?? 0} leads · {clients_count ?? 0} clients · {s.cases_count ?? 0} cases
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">${Number(s.sales_value ?? 0).toLocaleString()} this {teamPeriod}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-emerald-600 text-sm">{s.leads_won ?? 0} wins</p>
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`text-xs font-bold ${(s.conversion_rate ?? 0) >= 30 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {s.conversion_rate ?? 0}%
                        </span>
                        {(s.conversion_rate ?? 0) >= 30
                          ? <ArrowUpRight size={11} className="text-emerald-500" />
                          : <ArrowDownRight size={11} className="text-red-400" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      ),
    },
    {
      id: 'teamGoals', label: 'Team Goals', span: 'full',
      render: () => <GoalsBoard isAdmin={true} />,
    },
    {
      id: 'intakeFeed', label: 'Intake Feed', span: 'full',
      render: () => (
        !loading && intakeLeads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
            className="card p-5"
          >
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-[#06babe]" />
                <h2 className="section-title">Intake Feed</h2>
                <span className="bg-[#06babe]/10 text-[#06babe] text-xs font-bold px-2 py-0.5 rounded-full">
                  {intakeLeads.length} new
                </span>
              </div>
              <span className="text-xs text-slate-400">Last 7 days · web &amp; social</span>
            </div>
            <div className="space-y-1">
              {intakeLeads.map((lead, i) => {
                const src = SOURCE_ICON[normalizeSource(lead.lead_source || lead.referral_source)] || { Icon: Globe, cls: 'text-slate-400 bg-slate-100 dark:bg-slate-800' }
                const acting = intakeActing[lead.id]
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${src.cls}`}>
                      <src.Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{lead.doctor_name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {lead.case_interest || 'No case specified'} · {timeAgo(lead.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => handleIntakeAction(lead, 'approve')} disabled={!!acting}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40">
                        <CheckCircle size={12} />
                        {acting === 'approve' ? '…' : 'Approve'}
                      </button>
                      <button onClick={() => handleIntakeAction(lead, 'archive')} disabled={!!acting}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40">
                        <Archive size={12} />
                        {acting === 'archive' ? '…' : 'Archive'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      ),
    },
    {
      id: 'casePipeline', label: 'Active Case Pipeline', span: 'full',
      render: () => (
        !loading && casePipeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
            className="card p-5"
          >
            <div className="section-header">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-[#06babe]" />
                <h2 className="section-title">Active Case Pipeline</h2>
              </div>
              <span className="text-xs text-slate-400">{casePipeline.reduce((s, c) => s + Number(c.count), 0)} open cases</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {casePipeline.map(({ status, count }) => (
                <div key={status} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight font-medium">{status}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )
      ),
    },
    {
      id: 'revenueByBrand', label: 'Revenue by Brand', span: 'third',
      render: () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
          className="card p-5"
        >
          <h2 className="section-title mb-4">Revenue by Brand</h2>
          {brandRevenue.length === 0 ? (
            <EmptyState icon={DollarSign} title="No revenue data yet" size="sm" />
          ) : (
            <div className="space-y-4">
              {brandRevenue.map(({ brand, revenue }) => {
                const pct = totalRev > 0 ? Math.round((revenue / totalRev) * 100) : 0
                return (
                  <div key={brand}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{brand}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {fmt(revenue)} <span className="text-xs text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
                        style={{ backgroundColor: BRAND_COLORS[brand] || '#06babe' }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Total</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(totalRev)}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ),
    },
    {
      id: 'coldLeads', label: 'Cold Leads', span: 'third',
      render: () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48, duration: 0.4 }}
          className="card p-5"
        >
          <div className="section-header mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h2 className="section-title">Cold Leads</h2>
            </div>
            {coldLeads.length > 0 && (
              <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-100 dark:border-amber-900">
                {coldLeads.length} need follow-up
              </span>
            )}
          </div>
          {coldLeads.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No cold leads" description="Great job staying on top of your pipeline!" size="sm" />
          ) : (
            <div className="space-y-2.5">
              {coldLeads.slice(0, 4).map((lead, i) => {
                const days = lead.last_contacted_at
                  ? Math.floor((Date.now() - new Date(lead.last_contacted_at)) / 86400000) : '?'
                return (
                  <motion.div key={lead.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                    className="flex items-center gap-3 text-sm p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700 dark:text-amber-400">
                      {lead.doctor_name.split(' ').pop()[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                      <p className="text-xs text-slate-400">{lead.assigned_to_name || lead.clinic_name}</p>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">{days}d</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      ),
    },
    {
      id: 'recentLeads', label: 'Recent Leads', span: 'third',
      render: () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56, duration: 0.4 }}
          className="card p-5"
        >
          <div className="section-header mb-4">
            <h2 className="section-title">Recent Leads</h2>
            <Link to="/leads" className="text-xs text-[#057a7e] hover:underline font-medium">View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState icon={Users} title="No leads yet" description="Add your first lead to get started." size="sm" />
          ) : (
            <div className="space-y-2.5">
              {recentLeads.map((lead, i) => (
                <motion.div key={lead.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  className="flex items-center gap-3 text-sm p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#06babe]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#06babe]">
                    {lead.doctor_name.split(' ').pop()[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{lead.doctor_name}</p>
                    <p className="text-xs text-slate-400">{lead.case_interest || lead.assigned_to_name}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_CLASSES[lead.status] || 'status-lead'}`}>
                    {lead.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ),
    },
  ]

  const { order: adminOrder, loaded: adminLoaded, visibleOrdered: adminVisible, save: saveAdmin, reset: resetAdmin } = useDashboardLayout('admin', ADMIN_WIDGETS)
  const [editingAdminLayout, setEditingAdminLayout] = useState(false)

  return (
    <div className="px-4 py-5 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{monthLabel} overview · both brands</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingAdminLayout(true)} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Settings2 size={14} /> Edit Layout
          </button>
          <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus size={14} /> Create Task
          </button>
          <button onClick={fetchData} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </motion.div>

      {adminLoaded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {adminVisible.map(w => (
            <div key={w.id} className={w.span === 'full' ? 'lg:col-span-3' : ''}>
              {w.render()}
            </div>
          ))}
        </div>
      )}

      {editingAdminLayout && (
        <EditLayoutModal
          registry={ADMIN_WIDGETS}
          order={adminOrder}
          onSave={async (newOrder) => { await saveAdmin(newOrder); setEditingAdminLayout(false) }}
          onReset={async () => { await resetAdmin(); setEditingAdminLayout(false) }}
          onClose={() => setEditingAdminLayout(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={null}
          clients={clients}
          reps={reps}
          canAssign
          currentUserId={user?.id}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}
```

Note the local variable rename `order`/`loaded`/`visibleOrdered`/`save`/`reset` → `adminOrder`/`adminLoaded`/`adminVisible`/`saveAdmin`/`resetAdmin` — required since `RepDashboard` and `AdminDashboard` are separate function components, so there's no actual naming collision, but keep the `admin`-prefixed names as written above for clarity against `RepDashboard`'s unprefixed ones (both exist in the same file).

- [ ] **Step 2: Verify it builds**

```bash
cd Frontend && npm run build
```

Expected: builds clean.

- [ ] **Step 3: Manual verification (Playwright or a real browser)**

Log in as an admin (e.g., `media@aimdentallab.com`), navigate to `/dashboard`, and confirm:

1. The page looks identical to before this change — KPI Cards, Rep Performance, Team Goals, (Intake Feed if there's intake data), Active Case Pipeline, then Revenue by Brand / Cold Leads / Recent Leads packed three-across on desktop.
2. Click "Edit Layout" → all 8 widgets listed.
3. Uncheck "Cold Leads", Save → the bottom row now shows just Revenue by Brand and Recent Leads (two of the three `lg:col-span-1` slots), no gap or broken grid.
4. Move "Team Goals" to the very top via the up arrows, Save → it renders first, before KPI Cards.
5. Reload the page → both changes persist.
6. "Reset to Default" → back to the original 8-widget layout.
7. Confirm the Rep Dashboard's own saved layout (from Task 4's verification) is untouched by any of this — log back in as William, `/dashboard` still shows whatever was left from Task 4's test (proves `dashboard_type` correctly isolates `rep` from `admin` even though a single admin account could theoretically hit either type).

- [ ] **Step 4: Commit**

```bash
cd Frontend
git add src/pages/Dashboard.jsx
git commit -m "$(cat <<'EOF'
Make the admin Command Center's widgets show/hide + reorderable

Same useDashboardLayout + EditLayoutModal pattern as the Rep
Dashboard, with full/third span hints so Revenue by Brand, Cold
Leads, and Recent Leads keep packing three-across by default.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** table + 3 endpoints (Task 1), reconciliation logic (Task 2), edit UI with drag + buttons + reset (Task 3), rep dashboard wiring (Task 4), admin dashboard wiring with full/third spans (Task 5). All spec sections have a task.
- **Placeholder scan:** no TBD/TODO; every step has real code or an exact curl/manual-check sequence.
- **Type consistency:** `useDashboardLayout(type, registry)` return shape (`order`, `loaded`, `visibleOrdered`, `save`, `reset`) is identical across Task 2's definition and Tasks 4/5's usage. `EditLayoutModal` props (`registry`, `order`, `onSave`, `onReset`, `onClose`) match between Task 3's definition and Tasks 4/5's usage. Widget shape `{id, label, span, render}` is consistent across Tasks 2–5.
