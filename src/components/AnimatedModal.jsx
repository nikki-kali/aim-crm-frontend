import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Bottom sheet on mobile (slides up, flush to viewport bottom, rounded top
// corners only), centered dialog on desktop. Portaled to <body> so it's
// truly viewport-fixed even on pages where PageTransition's `filter`
// animation would otherwise make `position: fixed` relative to the page
// box instead of the viewport (a non-`none` CSS filter creates a
// containing block for fixed descendants).
//
// `header`/`footer` are optional fixed regions around a scrolling body
// (`children`) — this is what keeps primary actions (Save/Cancel) reachable
// without scrolling a long form on a short mobile viewport.

const MAX_WIDTH = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

export default function AnimatedModal({
  children,
  onClose,
  header,
  footer,
  maxWidth = 'lg',
  zIndex = 50,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose?.(); return }
      // Basic focus trap: keep Tab/Shift+Tab cycling within the panel
      // rather than escaping to the (visually dimmed but still in the DOM)
      // page behind it — the shared primitive behind every "New X" modal
      // and sheet in the app had no dialog semantics or focus containment
      // at all before this (found in the 2026-09-12 UI/UX review).
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(FOCUSABLE)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    const previouslyFocused = document.activeElement
    const toFocus = panelRef.current?.querySelector(FOCUSABLE) || panelRef.current
    toFocus?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* Panel */}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative w-full ${MAX_WIDTH[maxWidth] || MAX_WIDTH.lg} rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden focus:outline-none`}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {header && (
          <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
            {header}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 pb-safe">
            {footer}
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  )
}
