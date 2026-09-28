import { useEffect, useRef, useState } from 'react'

// True when the viewer's browser/OS has "reduce motion" turned on.
// Checked fresh each call (cheap, no listener needed - see the design
// spec: this page checks it once per mount, not live).
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

// Animates a displayed number from 0 up to `target` over `durationMs`,
// eased out (fast start, slow finish). Jumps straight to `target` with
// no animation frames at all when prefersReducedMotion() is true.
// Re-runs whenever `target` changes (e.g. new data loaded).
export function useCountUp(target, durationMs = 700) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const frameRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return undefined
    }
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      setValue(target * easeOutCubic(t))
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs])

  return value
}
