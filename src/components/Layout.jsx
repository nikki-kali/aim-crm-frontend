import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, UserCheck, LogOut, Menu, X, ClipboardList,
  BarChart3, TrendingUp, Zap, UserCog, Shield, Building2, ListChecks, Camera,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AlertsBell from './AlertsBell'
import QuickLeadButton from './QuickLeadButton'
import api from '../lib/api'

const STAFF_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',     icon: Users,           label: 'Leads' },
  { to: '/clients',   icon: UserCheck,       label: 'Clients' },
  { to: '/cases',     icon: ClipboardList,   label: 'Cases' },
  { to: '/pipeline',  icon: BarChart3,       label: 'Pipeline' },
  { to: '/reports',   icon: TrendingUp,      label: 'My Reports' },
  { to: '/eos',       icon: ListChecks,      label: 'EOS' },
]

const ADMIN_NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',       icon: Users,           label: 'Leads' },
  { to: '/clients',     icon: UserCheck,       label: 'Clients' },
  { to: '/clinics',     icon: Building2,       label: 'Clinics' },
  { to: '/cases',       icon: ClipboardList,   label: 'Cases' },
  { to: '/pipeline',    icon: BarChart3,       label: 'Pipeline' },
  { to: '/reports',     icon: TrendingUp,      label: 'Reports' },
  { to: '/eos',         icon: ListChecks,      label: 'EOS' },
  { to: '/automations', icon: Zap,             label: 'Automations' },
  { to: '/users',       icon: UserCog,         label: 'Users' },
]

function Avatar({ user, size = 32, onClick, uploading }) {
  const initials = (user?.name || user?.email || '?')[0].toUpperCase()
  return (
    <button
      onClick={onClick}
      title="Click to change profile photo"
      className="relative group flex-shrink-0 focus:outline-none"
      style={{ width: size, height: size }}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full rounded-full object-cover ring-2 ring-[#06babe]/30 group-hover:ring-[#06babe]/60 transition-all"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-bold ring-2 ring-[#06babe]/30 group-hover:ring-[#06babe]/60 transition-all"
          style={{
            background: 'linear-gradient(135deg, #06babe, #207290)',
            fontSize: size * 0.38,
          }}
        >
          {initials}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading
          ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : <Camera size={size * 0.32} className="text-white" />}
      </div>
    </button>
  )
}

export default function Layout({ children }) {
  const { user, signOut, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAvatarClick = () => fileRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        const ratio = Math.max(200 / img.width, 200 / img.height)
        const w = img.width * ratio
        const h = img.height * ratio
        ctx.drawImage(img, (200 - w) / 2, (200 - h) / 2, w, h)
        const base64 = canvas.toDataURL('image/jpeg', 0.85)
        try {
          await api.put('/api/users/me/avatar', { avatar: base64 })
          await refreshUser()
        } catch {}
        setUploading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <img src="/logo.png" alt="Aim Dental Laboratory" className="h-8 w-auto" />
          <AlertsBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
          >
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
                whileHover={{ x: 3 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#06babe]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-[#06babe]/10"
                    style={{ boxShadow: '0 0 12px 0 rgba(6,186,190,0.18)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={18} className="relative z-10 flex-shrink-0" />
                <span className="relative z-10">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-[#06babe]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <Avatar user={user} size={36} onClick={handleAvatarClick} uploading={uploading} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate leading-tight">{user?.name || user?.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={9} className={isAdmin ? 'text-[#06babe]' : 'text-gray-300'} />
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'staff'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              className="fixed inset-0 bg-black/30"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="relative w-56 bg-white flex flex-col h-full shadow-xl"
              initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <Sidebar />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-gray-500">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-900">Aim Dental CRM</span>
          <AlertsBell />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <QuickLeadButton />
    </div>
  )
}
