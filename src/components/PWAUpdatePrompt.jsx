import { useRegisterSW } from 'virtual:pwa-register/react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

// Checks for a new deployed build periodically while the tab stays open,
// since the SW otherwise only checks on a fresh page load.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed above-tabbar md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100"
        >
          <RefreshCw size={16} className="text-[#06babe] flex-shrink-0" />
          <span className="flex-1">A new version is available.</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="bg-[#06babe] hover:bg-[#059ea1] text-white font-medium text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
          >
            Reload
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
          >
            Later
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
