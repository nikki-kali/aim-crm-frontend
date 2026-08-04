import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { TOUR_MODULES, FULL_TOUR_ORDER } from '../lib/tourSteps'

const TourContext = createContext(null)

// How long (and how often) to wait for a target element to mount on the
// next page before giving up on a step — a route change is async (data
// fetch + render), so the overlay can't just assume the target exists the
// instant navigate() resolves.
const POLL_INTERVAL_MS = 100
const POLL_MAX_ATTEMPTS = 30 // 3s ceiling

export function TourProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [moduleQueue, setModuleQueue] = useState([]) // module ids left to run, in order
  const [moduleId, setModuleId] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetReady, setTargetReady] = useState(false)
  const [completed, setCompleted] = useState([]) // [{item_type, item_id, completed_at}]
  const [progressLoaded, setProgressLoaded] = useState(false)
  const pollRef = useRef(null)

  const loadProgress = useCallback(async () => {
    if (!user) return
    try {
      const rows = await api.get('/api/training/progress')
      setCompleted(rows)
    } catch {
      setCompleted([])
    } finally {
      setProgressLoaded(true)
    }
  }, [user])

  const markComplete = useCallback(async (item_type, item_id) => {
    setCompleted((prev) => {
      if (prev.some((p) => p.item_type === item_type && p.item_id === item_id)) return prev
      return [...prev, { item_type, item_id, completed_at: new Date().toISOString() }]
    })
    try {
      await api.post('/api/training/progress', { item_type, item_id })
    } catch {
      // Best-effort — the optimistic local state still reflects completion
      // for this session even if the write fails.
    }
  }, [])

  useEffect(() => { if (user) loadProgress() }, [user, loadProgress])

  const isComplete = useCallback(
    (item_type, item_id) => completed.some((p) => p.item_type === item_type && p.item_id === item_id),
    [completed]
  )

  const currentModule = moduleId ? TOUR_MODULES.find((m) => m.id === moduleId) : null
  const currentStep = currentModule ? currentModule.steps[stepIndex] : null

  const waitForTarget = useCallback((selector) => {
    if (pollRef.current) clearInterval(pollRef.current)
    setTargetReady(false)
    let attempts = 0
    pollRef.current = setInterval(() => {
      attempts += 1
      if (document.querySelector(selector)) {
        clearInterval(pollRef.current)
        setTargetReady(true)
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(pollRef.current)
        setTargetReady(true) // give up waiting — overlay will just skip if still missing
      }
    }, POLL_INTERVAL_MS)
  }, [])

  const goToStep = useCallback((mod, idx) => {
    const step = mod.steps[idx]
    if (!step) return
    setStepIndex(idx)
    if (location.pathname !== mod.route) {
      navigate(mod.route)
    }
    waitForTarget(step.target)
  }, [location.pathname, navigate, waitForTarget])

  const advanceModule = useCallback((queue) => {
    if (queue.length === 0) {
      setModuleId(null)
      setModuleQueue([])
      return
    }
    const [nextId, ...rest] = queue
    const mod = TOUR_MODULES.find((m) => m.id === nextId)
    setModuleId(nextId)
    setModuleQueue(rest)
    if (mod) goToStep(mod, 0)
  }, [goToStep])

  const startTour = useCallback((idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
    advanceModule(ids)
  }, [advanceModule])

  const startFullTour = useCallback(() => {
    const visible = FULL_TOUR_ORDER.filter((id) => {
      const mod = TOUR_MODULES.find((m) => m.id === id)
      return mod && (!mod.adminOnly || user?.role === 'admin')
    })
    advanceModule(visible)
  }, [advanceModule, user])

  const next = useCallback(() => {
    if (!currentModule) return
    if (stepIndex + 1 < currentModule.steps.length) {
      goToStep(currentModule, stepIndex + 1)
    } else {
      markComplete('tour', currentModule.id)
      advanceModule(moduleQueue)
    }
  }, [currentModule, stepIndex, goToStep, markComplete, advanceModule, moduleQueue])

  const back = useCallback(() => {
    if (!currentModule || stepIndex === 0) return
    goToStep(currentModule, stepIndex - 1)
  }, [currentModule, stepIndex, goToStep])

  const skip = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    setModuleId(null)
    setModuleQueue([])
  }, [])

  const value = {
    active: !!currentModule,
    currentModule,
    currentStep,
    stepIndex,
    targetReady,
    startTour,
    startFullTour,
    next,
    back,
    skip,
    completed,
    progressLoaded,
    loadProgress,
    markComplete,
    isComplete,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export const useTour = () => useContext(TourContext)
