import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Share, PlusSquare, CheckCircle2, Chrome, MoreVertical, Download } from 'lucide-react'

const ORBS = [
  { size: 520, top: '-10%', left: '-10%', x: [0, 40, 0], y: [0, 30, 0], dur: 12, color: '#06babe', opacity: 0.18 },
  { size: 400, top: '50%',  left: '60%',  x: [0, -35, 0], y: [0, -40, 0], dur: 15, color: '#207290', opacity: 0.14 },
  { size: 300, top: '70%',  left: '5%',   x: [0, 25, 0], y: [0, -20, 0], dur: 10, color: '#06babe', opacity: 0.10 },
  { size: 250, top: '15%',  left: '70%',  x: [0, -20, 0], y: [0, 30, 0], dur: 9,  color: '#0891b2', opacity: 0.12 },
]

function Step({ n, icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-[#06babe]/10 text-[#06babe] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {n}
      </div>
      <p className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
        {children} {Icon && <Icon size={15} className="inline text-[#207290]" />}
      </p>
    </div>
  )
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState('other')

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream
    const isAndroid = /android/i.test(ua)
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true

    if (isStandalone) setInstalled(true)
    else if (isIOS) setPlatform('ios')
    else if (isAndroid) setPlatform('android')
    else setPlatform('desktop')

    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    const handleInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <div className="relative min-h-screen bg-[#f0fbfc] flex items-center justify-center p-4 overflow-hidden">

      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width: orb.size, height: orb.size, top: orb.top, left: orb.left, background: orb.color, opacity: orb.opacity, filter: 'blur(80px)' }}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ duration: orb.dur, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      ))}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,186,190,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,186,190,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm z-10">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <img
            src="/pwa-512.png"
            alt="Aim CRM"
            className="w-20 h-20 rounded-[22%] mx-auto mb-4 shadow-lg shadow-[#06babe]/20"
          />
          <h1 className="text-xl font-bold text-slate-800">Install Aim CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Get it on your phone — full app, no App Store</p>
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        >
          {installed ? (
            <div className="text-center py-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">You're all set</p>
              <p className="text-sm text-gray-500 mt-1">Aim CRM is already installed on this device.</p>
            </div>
          ) : deferredPrompt ? (
            <div className="text-center py-1">
              <p className="text-sm text-slate-600 mb-4">Your browser supports one-tap install.</p>
              <button onClick={handleInstallClick} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                <Download size={16} /> Install Now
              </button>
            </div>
          ) : platform === 'ios' ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#207290] mb-1">On iPhone / iPad — Safari</p>
              <Step n={1} icon={Share}>Tap the <b>Share</b> icon in Safari's toolbar</Step>
              <Step n={2} icon={PlusSquare}>Scroll down and tap <b>Add to Home Screen</b></Step>
              <Step n={3}>Tap <b>Add</b> in the top right — done</Step>
            </div>
          ) : platform === 'android' ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#207290] mb-1">On Android — Chrome</p>
              <Step n={1} icon={MoreVertical}>Tap the <b>⋮</b> menu in the top right</Step>
              <Step n={2} icon={Download}>Tap <b>Install app</b> (or <b>Add to Home screen</b>)</Step>
              <Step n={3}>Confirm — it'll open like any other app</Step>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#207290] mb-1">On Desktop — Chrome / Edge</p>
              <Step n={1} icon={Chrome}>Look for an install icon in the address bar</Step>
              <Step n={2}>Or open the <b>⋮</b> menu and choose <b>Install Aim CRM</b></Step>
              <Step n={3}>It'll open in its own window from now on</Step>
            </div>
          )}
        </motion.div>

        <motion.p
          className="text-center text-xs text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Already have an account? <a href="/login" className="text-[#06babe] font-medium hover:underline">Sign in</a> once it's installed.
        </motion.p>
      </div>
    </div>
  )
}
