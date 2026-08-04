import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useLayoutEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useTour } from '../context/TourContext'

const PAD = 8 // breathing room between the highlight ring and the target's real edges
const GAP = 14 // gap between the highlight ring and the tooltip card
const MARGIN = 16 // minimum distance the tooltip card is kept from any viewport edge

function useTargetRect(selector, ready) {
  const [rect, setRect] = useState(null)

  const measure = useCallback(() => {
    if (!ready) return
    const el = document.querySelector(selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [selector, ready])

  useLayoutEffect(() => {
    if (!ready) return
    const el = document.querySelector(selector)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // Scroll settles asynchronously — remeasure a couple times after the
    // initial pass instead of trusting one synchronous read.
    measure()
    const t1 = setTimeout(measure, 120)
    const t2 = setTimeout(measure, 350)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selector, ready, measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure])

  return rect
}

// Cheap first-paint guess (before we've measured the card's real size) —
// centers on the target using an assumed width, via a translate(-50%) trick.
// useClampedTooltipStyle immediately corrects this once the card exists in
// the DOM, using its actual measured dimensions instead of an assumption.
function guessTooltipStyle(rect, placement) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceBelow = vh - (rect.top + rect.height)
  const spaceAbove = rect.top
  let finalPlacement = placement || 'bottom'
  if (finalPlacement === 'bottom' && spaceBelow < 180 && spaceAbove > spaceBelow) finalPlacement = 'top'
  if (finalPlacement === 'top' && spaceAbove < 180 && spaceBelow > spaceAbove) finalPlacement = 'bottom'

  const assumedHalfWidth = 160
  const centerX = Math.min(Math.max(rect.left + rect.width / 2, MARGIN + assumedHalfWidth), vw - MARGIN - assumedHalfWidth)

  if (finalPlacement === 'top') {
    return { left: centerX, top: rect.top - PAD - GAP, transform: 'translate(-50%, -100%)' }
  }
  return { left: centerX, top: rect.top + rect.height + PAD + GAP, transform: 'translate(-50%, 0)' }
}

// Measures the tooltip card's *actual* rendered size and clamps its
// top-left position so every edge stays at least MARGIN px inside the
// viewport — fixes cards clipping off-screen near the right/bottom edge
// when their real width/height (which varies per step's body text) is
// wider or taller than the fixed assumption guessTooltipStyle uses.
function useClampedTooltipStyle(cardRef, rect, placement, depsKey) {
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    if (!rect || !cardRef.current) { setStyle(null); return }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cardW = cardRef.current.offsetWidth
    const cardH = cardRef.current.offsetHeight

    const spaceBelow = vh - (rect.top + rect.height)
    const spaceAbove = rect.top
    let side = placement === 'top' ? 'top' : 'bottom'
    if (side === 'bottom' && spaceBelow < cardH + GAP + MARGIN && spaceAbove > spaceBelow) side = 'top'
    if (side === 'top' && spaceAbove < cardH + GAP + MARGIN && spaceBelow > spaceAbove) side = 'bottom'

    let left = rect.left + rect.width / 2 - cardW / 2
    left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - cardW - MARGIN))

    let top = side === 'top' ? rect.top - PAD - GAP - cardH : rect.top + rect.height + PAD + GAP
    top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - cardH - MARGIN))

    setStyle({ left, top, transform: 'none' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, placement, depsKey])

  return style
}

function Spotlight({ rect }) {
  if (!rect) return null
  const top = rect.top - PAD
  const left = rect.left - PAD
  const width = rect.width + PAD * 2
  const height = rect.height + PAD * 2

  const dim = 'fixed bg-black/55 backdrop-blur-[1px] pointer-events-none transition-all duration-200'
  return (
    <>
      <div className={dim} style={{ top: 0, left: 0, right: 0, height: Math.max(top, 0) }} />
      <div className={dim} style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <div className={dim} style={{ top, left: 0, width: Math.max(left, 0), height }} />
      <div className={dim} style={{ top, left: left + width, right: 0, height }} />
      <div
        className="fixed rounded-xl pointer-events-none transition-all duration-200"
        style={{
          top, left, width, height,
          boxShadow: '0 0 0 3px rgba(6,186,190,0.9), 0 0 24px 4px rgba(6,186,190,0.45)',
        }}
      />
    </>
  )
}

export default function TourOverlay() {
  const tour = useTour()
  const { active, currentModule, currentStep, stepIndex, targetReady, next, back, skip } = tour || {}
  const cardRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') skip?.() }
    if (active) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, skip])

  const rect = useTargetRect(currentStep?.target, !!(active && targetReady))
  const clampedStyle = useClampedTooltipStyle(cardRef, rect, currentStep?.placement, `${currentModule?.id}-${stepIndex}`)

  if (!active || !currentModule || !currentStep) return null

  const missing = targetReady && !rect
  const tooltipStyle = clampedStyle || guessTooltipStyle(rect, currentStep.placement)
  const isLast = stepIndex === currentModule.steps.length - 1
  const isFirst = stepIndex === 0

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 200 }}>
      <AnimatePresence>
        {rect && <Spotlight rect={rect} />}
      </AnimatePresence>

      {/* Full scrim while waiting for the target (or if it never mounted) */}
      {(!targetReady || missing) && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-[1px] pointer-events-none" />
      )}

      <motion.div
        ref={cardRef}
        key={`${currentModule.id}-${stepIndex}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="fixed w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between px-5 pt-4 pb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#06babe]">
              {currentModule.label} · Step {stepIndex + 1} of {currentModule.steps.length}
            </p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1">{currentStep.title}</h3>
          </div>
          <button onClick={skip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mt-1 -mr-1 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {missing ? 'This part of the page isn\'t visible right now — you can still move on.' : currentStep.body}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 px-5 pb-4">
          <button onClick={skip} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button onClick={back} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <ChevronLeft size={13} /> Back
              </button>
            )}
            <button onClick={next} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              {isLast ? <>Done <Check size={13} /></> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
