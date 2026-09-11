# Customizable Dashboard — Design

## Problem

The Rep Dashboard and admin Command Center (`Dashboard.jsx`) are both hardcoded sequences of cards. Users have no way to hide widgets they don't use or reorder ones they check first. This spec adds per-user, per-dashboard customization: show/hide any widget, reorder them, with the current layout as the untouched default for anyone who never customizes.

## Scope

- Rep dashboard and admin Command Center, customized independently per user.
- Show/hide and reorder. No per-widget resizing, no cross-dashboard widget sharing, no admin-set defaults for other users (each user's layout is their own).
- Persisted server-side so it follows the user across devices/browsers, consistent with the rest of this app's state.

## Data model

New table (migration `v18-dashboard-layout-migration.sql`):

```sql
CREATE TABLE dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  dashboard_type text NOT NULL CHECK (dashboard_type IN ('rep','admin')),
  widgets jsonb NOT NULL,  -- ordered [{id, visible}, ...]
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dashboard_type)
);
```

No row for a user+dashboard_type means "use the hardcoded default" — the default is the current, existing layout (every widget, current order, all visible). This is what makes "current layout stays the default" true without a backfill: everyone starts with no row.

## Backend (`src/routes/dashboardLayout.js`, mounted at `/api/dashboard-layout`)

- `GET /api/dashboard-layout?type=rep|admin` — returns the caller's saved `widgets` array for that type, or `null` if none saved. Auth-only (any logged-in user); a rep requesting `type=admin` (or vice versa) just gets their own row for that type if they happen to have one — dashboard_type is caller-scoped, not role-enforced, since which dashboard a user *sees* is already decided by `Dashboard.jsx`'s existing role branch, not by this endpoint.
- `PUT /api/dashboard-layout` — body `{ dashboard_type, widgets }`, upserts on `(user_id, dashboard_type)`. `widgets` must be an array of `{id, visible}` objects; the id set isn't validated against the current registry server-side (frontend reconciles — see below), so adding a new widget to the registry later doesn't break old saved layouts.
- `DELETE /api/dashboard-layout?type=rep|admin` — removes the saved row (reset to default).

## Frontend

### Widget registry

Each dashboard becomes a `WIDGETS` array of `{ id, label, span, render }` instead of inline JSX, where `span` is `'full'` or `'third'` (a layout hint, not user-editable — it's what lets Revenue by Brand / Cold Leads / Recent Leads keep packing three-across on the admin dashboard while everything else stays full-width). `render` is a function/component receiving the same props the current inline JSX block already closes over (kpis, tasks, teamStats, etc.) so this is a mechanical extraction, not new data-fetching logic.

- **Rep dashboard**: `tasksForToday`, `kpiCards`, `suggestions`, `recentLeads` — all `full`.
- **Admin dashboard**: `kpiCards`, `repPerformance`, `teamGoals`, `intakeFeed`, `casePipeline` (all `full`), `revenueByBrand`, `coldLeads`, `recentLeads` (all `third`).

### Layout resolution

On mount, fetch the saved layout (`GET /api/dashboard-layout?type=...`). Reconcile against the registry:
- Widgets in the saved list that still exist in the registry: use the saved visibility/order.
- Widgets in the registry but missing from the saved list (newly added later): append them, visible, at the end — so a future widget addition doesn't silently vanish for users who already customized.
- Widgets in the saved list no longer in the registry (removed later): drop them.

If no saved layout: use the registry's natural order, everything visible (today's behavior, byte-for-byte).

### Rendering

```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
  {orderedVisibleWidgets.map(w => (
    <div key={w.id} className={w.span === 'full' ? 'lg:col-span-3' : ''}>
      {w.render(sharedProps)}
    </div>
  ))}
</div>
```

Conditionally-empty widgets (Intake Feed only when there are intake leads, etc.) keep their existing internal empty checks — a widget being "visible" in the layout just means it's eligible to render, same as today.

### Edit Layout panel

An "Edit Layout" button (next to Refresh) opens an `AnimatedModal` listing every registry widget as a row: a checkbox (visible/hidden) and up/down move buttons — buttons are the primary, always-works reorder mechanism (works on touch). Each row is also `draggable` on desktop, matching the same native HTML5 drag-and-drop Pipeline.jsx already uses, as a bonus — not the only way to reorder, since that pattern is already documented in this codebase as not firing on touch. A "Reset to Default" action calls `DELETE /api/dashboard-layout` and reloads the registry defaults. Saving calls `PUT` with the new `{id, visible}` order and re-renders immediately (optimistic).

## Out of scope

- Per-widget sizing/resizing beyond the fixed full/third hint.
- Admins setting a default layout for their team.
- Widget-level configuration (e.g. choosing which KPIs appear inside the KPI row).
