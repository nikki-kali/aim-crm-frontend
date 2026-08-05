import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Sun, Moon, LogOut, Shield, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import AnimatedModal from './AnimatedModal'
import { Avatar, GROUP_LABELS } from './Layout'
import { roleLabel } from '../lib/roles'

// Primary mobile destinations — Pipeline is deliberately excluded: its
// drag-and-drop kanban is built on HTML5 draggable, which doesn't fire on
// touch at all, so it would be a dead tab. It's reachable from More instead.
const MOBILE_TAB_PATHS = ['/dashboard', '/leads', '/cases', '/clients']

function isActivePath(currentPath, to) {
  return currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to))
}

function MoreSheet({ navItems, isAdmin, user, onAvatarClick, uploading, onSignOut, onClose, currentPath }) {
  const { isDark, toggle: toggleTheme } = useTheme()
  const moreItems = navItems.filter(item => !MOBILE_TAB_PATHS.includes(item.to))

  const grouped = moreItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})
  const groupOrder = isAdmin ? ['main', 'crm', 'tools', 'admin'] : ['main', 'crm', 'tools']

  return (
    <AnimatedModal
      onClose={onClose}
      maxWidth="lg"
      header={
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar user={user} size={40} onClick={onAvatarClick} uploading={uploading} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user?.name || user?.email}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={9} className={isAdmin ? 'text-[#06babe]' : 'text-slate-300 dark:text-slate-600'} />
              <p className="text-xs text-slate-400">{roleLabel(user?.role || 'staff')}</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="px-3 py-2">
        {groupOrder.map(gKey => grouped[gKey] && (
          <div key={gKey} className="mb-1">
            {GROUP_LABELS[gKey] && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {GROUP_LABELS[gKey]}
              </p>
            )}
            {grouped[gKey].map(({ to, icon: Icon, label }) => {
              const active = isActivePath(currentPath, to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'text-[#06babe] dark:text-teal-400 bg-[#06babe]/8'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                </NavLink>
              )
            })}
          </div>
        ))}

        <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 pb-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="flex-1 text-left">{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            onClick={() => { onClose(); onSignOut() }}
            className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={18} />
            <span className="flex-1 text-left">Sign out</span>
          </button>
        </div>
      </div>
    </AnimatedModal>
  )
}

export default function MobileTabBar({ user, isAdmin, navItems, currentPath, onAvatarClick, uploading, onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs = MOBILE_TAB_PATHS
    .map(path => navItems.find(item => item.to === path))
    .filter(Boolean)

  const anyTabActive = tabs.some(t => isActivePath(currentPath, t.to))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-safe bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-200 border-t border-white/40 dark:border-white/10">
        <div className="grid grid-cols-5 h-14">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = isActivePath(currentPath, to)
            return (
              <NavLink key={to} to={to} className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] px-1">
                {active && (
                  <motion.div
                    layoutId="mobile-tab-active"
                    className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#06babe] dark:bg-teal-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon size={21} className={active ? 'text-[#06babe] dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'} />
                <span className={`text-[10px] font-medium truncate max-w-full ${active ? 'text-[#06babe] dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {label}
                </span>
              </NavLink>
            )
          })}
          <button onClick={() => setMoreOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] px-1">
            {!anyTabActive && (
              <motion.div
                layoutId="mobile-tab-active"
                className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#06babe] dark:bg-teal-400"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <MoreHorizontal size={21} className={!anyTabActive ? 'text-[#06babe] dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className={`text-[10px] font-medium ${!anyTabActive ? 'text-[#06babe] dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <MoreSheet
            navItems={navItems}
            isAdmin={isAdmin}
            user={user}
            onAvatarClick={onAvatarClick}
            uploading={uploading}
            onSignOut={onSignOut}
            onClose={() => setMoreOpen(false)}
            currentPath={currentPath}
          />
        )}
      </AnimatePresence>
    </>
  )
}
