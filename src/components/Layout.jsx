import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, UserCheck, LogOut, Menu, X, ClipboardList,
  BarChart3, TrendingUp, Zap, UserCog, Shield,
} from 'lucide-react'
import { useState } from 'react'
import AlertsBell from './AlertsBell'
import QuickLeadButton from './QuickLeadButton'

const STAFF_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',     icon: Users,           label: 'Leads' },
  { to: '/clients',   icon: UserCheck,       label: 'Clients' },
  { to: '/cases',     icon: ClipboardList,   label: 'Cases' },
  { to: '/pipeline',  icon: BarChart3,       label: 'Pipeline' },
]

const ADMIN_NAV = [
  ...STAFF_NAV,
  { to: '/reports',     icon: TrendingUp, label: 'Reports' },
  { to: '/automations', icon: Zap,        label: 'Automations' },
  { to: '/users',       icon: UserCog,    label: 'Users' },
]

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#06babe]/10 text-[#06babe]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-700 truncate">{user?.name || user?.email}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield size={10} className={isAdmin ? 'text-[#06babe]' : 'text-gray-300'} />
            <p className="text-xs text-gray-400 capitalize">{user?.role || 'staff'}</p>
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-white flex flex-col h-full shadow-xl">
            <Sidebar />
          </aside>
        </div>
      )}

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
