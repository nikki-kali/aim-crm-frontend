import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, Users, UserCheck, LogOut, ClipboardList,
  BarChart3, TrendingUp, Zap, UserCog, Shield, Building2,
  Camera, Sun, Moon, ChevronRight, CalendarDays, HelpCircle,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import AlertsBell from './AlertsBell'
import QuickLeadButton from './QuickLeadButton'
import MobileTabBar from './MobileTabBar'
import api from '../lib/api'

const STAFF_NAV = [
  { group: 'main', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { group: 'crm',  to: '/leads',     icon: Users,           label: 'Leads' },
  { group: 'crm',  to: '/clients',   icon: UserCheck,       label: 'Clients' },
  { group: 'crm',  to: '/cases',     icon: ClipboardList,   label: 'Cases' },
  { group: 'crm',  to: '/pipeline',  icon: BarChart3,       label: 'Pipeline' },
  { group: 'tools',to: '/reports',   icon: TrendingUp,      label: 'My Reports' },
  { group: 'tools',to: '/pickup-schedule', icon: CalendarDays, label: 'Case Pickup Schedules' },
  { group: 'tools',to: '/help',      icon: HelpCircle,      label: 'Help' },
]

const ADMIN_NAV = [
  { group: 'main',  to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { group: 'crm',   to: '/leads',       icon: Users,           label: 'Leads' },
  { group: 'crm',   to: '/clients',     icon: UserCheck,       label: 'Clients' },
  { group: 'crm',   to: '/clinics',     icon: Building2,       label: 'Clinics' },
  { group: 'crm',   to: '/cases',       icon: ClipboardList,   label: 'Cases' },
  { group: 'crm',   to: '/pipeline',    icon: BarChart3,       label: 'Pipeline' },
  { group: 'tools', to: '/reports',     icon: TrendingUp,      label: 'Reports' },
  { group: 'tools', to: '/pickup-schedule', icon: CalendarDays, label: 'Case Pickup Schedules' },
  { group: 'tools', to: '/help',        icon: HelpCircle,      label: 'Help' },
  { group: 'admin', to: '/automations', icon: Zap,             label: 'Automations' },
  { group: 'admin', to: '/users',       icon: UserCog,         label: 'Users' },
]

export const GROUP_LABELS = {
  main:  null,
  crm:   'CRM',
  tools: 'Tools',
  admin: 'Admin',
}

export function Avatar({ user, size = 32, onClick, uploading }) {
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
          className="w-full h-full rounded-full object-cover ring-2 ring-[#06babe]/30 group-hover:ring-[#06babe]/60 transition-all duration-200"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-bold ring-2 ring-[#06babe]/30 group-hover:ring-[#06babe]/60 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #06babe, #207290)',
            fontSize: size * 0.38,
          }}
        >
          {initials}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading
          ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : <Camera size={size * 0.32} className="text-white" />}
      </div>
    </button>
  )
}

function NavGroup({ items, groupKey, currentPath, onClose }) {
  const label = GROUP_LABELS[groupKey]
  return (
    <div>
      {label && (
        <p className="px-3 max-h-0 opacity-0 mt-0 mb-0 group-hover:max-h-8 group-hover:opacity-100 group-hover:mt-3 group-hover:mb-1 overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 select-none transition-all duration-200">
          {label}
        </p>
      )}
      {items.map(({ to, icon: Icon, label: navLabel }, i) => {
        const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to))
        return (
          <NavLink key={to} to={to} onClick={onClose} data-tour={`nav-${to.slice(1)}`} title={navLabel}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
              className={`relative flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer mb-0.5 ${
                isActive
                  ? 'text-[#06babe] dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-[#06babe]/8 dark:bg-teal-400/8"
                  style={{ boxShadow: '0 0 0 1px rgba(6,186,190,0.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <Icon size={17} className="relative z-10 flex-shrink-0" />
              <span className="relative z-10 max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-200">
                {navLabel}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#06babe] dark:bg-teal-400 flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:ml-auto transition-all duration-200"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
            </motion.div>
          </NavLink>
        )
      })}
    </div>
  )
}

function SidebarContent({ user, isAdmin, navItems, currentPath, onClose, onAvatarClick, uploading, onSignOut }) {
  const { isDark, toggle: toggleTheme } = useTheme()

  const grouped = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const groupOrder = isAdmin
    ? ['main', 'crm', 'tools', 'admin']
    : ['main', 'crm', 'tools']

  return (
    <div className="flex flex-col h-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl backdrop-saturate-200 border-r border-white/40 dark:border-white/10 shadow-[4px_0_40px_-8px_rgba(6,186,190,0.25)]">
      {/* Logo row — compact brand mark stays put as the icon rail's anchor;
          full wordmark fades/slides in alongside it once hovered open. */}
      <div className="px-4 pt-5 pb-4 border-b border-white/40 dark:border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <div
              className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #06babe, #207290)' }}
            >
              A
            </div>
            <img
              src="/logo.png"
              alt="Aim Dental"
              className="h-5 w-auto flex-shrink-0 max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 transition-all duration-200"
            />
          </div>
          <AlertsBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto no-scrollbar">
        {groupOrder.map(gKey => grouped[gKey] && (
          <NavGroup
            key={gKey}
            groupKey={gKey}
            items={grouped[gKey]}
            currentPath={currentPath}
            onClose={onClose}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-3 border-t border-white/40 dark:border-white/5 pt-3 space-y-1">
        {/* User info + avatar */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <Avatar user={user} size={36} onClick={onAvatarClick} uploading={uploading} />
          <div className="min-w-0 flex-1 max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-200">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight whitespace-nowrap">
              {user?.name || user?.email}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot flex-shrink-0" />
              <Shield size={9} className={`flex-shrink-0 ${isAdmin ? 'text-[#06babe]' : 'text-slate-300 dark:text-slate-600'}`} />
              <p className="text-xs text-slate-400 capitalize whitespace-nowrap">{user?.role || 'staff'}</p>
            </div>
          </div>
        </div>

        {/* Theme toggle + sign out row */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center w-9 h-9 flex-shrink-0 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex-1 flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-2.5 px-0 group-hover:px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-200">
              Sign out
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, signOut, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
        canvas.width = 200; canvas.height = 200
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

  const sidebarProps = {
    user, isAdmin, navItems,
    currentPath: location.pathname,
    onAvatarClick: handleAvatarClick,
    uploading,
    onSignOut: handleSignOut,
  }

  return (
    <div className="relative flex h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-[#f0fbfc] dark:bg-[#050b14]">
      {/* Ambient brand-colored blobs — same soft, low-opacity treatment as the
          Login page and aimdentallab.com's pale gradient background, rather
          than a saturated color field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-brand-600/20 dark:bg-brand-600/40 blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-[42rem] h-[42rem] rounded-full bg-navy-700/18 dark:bg-navy-600/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[34rem] h-[34rem] rounded-full bg-teal-400/15 dark:bg-teal-400/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-700/12 dark:bg-brand-500/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-teal-500/10 dark:bg-teal-500/20 blur-3xl" />
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Desktop sidebar — collapsed to an icon rail by default; hovering
          expands it to show labels. The rail reserves fixed layout width so
          content never reflows, and the expanded panel is absolutely
          positioned (higher z-index) so it overlays the page instead. */}
      <aside className="group relative z-20 hidden md:flex w-[72px] flex-shrink-0">
        <div className="absolute inset-y-0 left-0 w-[72px] group-hover:w-60 overflow-hidden transition-[width] duration-200 ease-out">
          <SidebarContent {...sidebarProps} onClose={() => {}} />
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 pt-safe bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl backdrop-saturate-200 border-b border-white/40 dark:border-white/10">
          <img src="/logo.png" alt="Aim Dental" className="h-6 w-auto" />
          <AlertsBell />
        </header>

        <main className="flex-1 overflow-y-auto pb-tabbar">
          {children}
        </main>

        <MobileTabBar {...sidebarProps} />
        <QuickLeadButton />
      </div>
    </div>
  )
}
