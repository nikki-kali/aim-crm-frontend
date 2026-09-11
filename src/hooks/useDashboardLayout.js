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
