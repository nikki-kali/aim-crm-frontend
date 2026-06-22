import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ORBS = [
  { size: 520, top: '-10%', left: '-10%', x: [0, 40, 0], y: [0, 30, 0], dur: 12, color: '#06babe', opacity: 0.18 },
  { size: 400, top: '50%',  left: '60%',  x: [0, -35, 0], y: [0, -40, 0], dur: 15, color: '#207290', opacity: 0.14 },
  { size: 300, top: '70%',  left: '5%',   x: [0, 25, 0], y: [0, -20, 0], dur: 10, color: '#06babe', opacity: 0.10 },
  { size: 250, top: '15%',  left: '70%',  x: [0, -20, 0], y: [0, 30, 0], dur: 9,  color: '#0891b2', opacity: 0.12 },
]

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f0fbfc] flex items-center justify-center p-4 overflow-hidden">

      {/* Animated gradient orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            background: orb.color,
            opacity: orb.opacity,
            filter: 'blur(80px)',
          }}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ duration: orb.dur, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,186,190,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,186,190,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm z-10">
        {/* Logos */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-center gap-6 mb-4">
            <img src="/logo.png" alt="Aim Dental Laboratory" className="h-10 w-auto drop-shadow-sm" />
            <div className="w-px h-8 bg-gray-300" />
            <img src="/kh-logo.png" alt="Kings Highway Dental Laboratory" className="h-10 w-auto drop-shadow-sm" />
          </div>
          <p className="text-sm text-gray-500 font-medium tracking-wide">CRM Portal</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@aimdentallab.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </motion.div>

        <motion.p
          className="text-center text-xs text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Contact your admin to get access
        </motion.p>
      </div>
    </div>
  )
}
