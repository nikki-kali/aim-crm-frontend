import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import Clinics from './pages/Clinics'
import Cases from './pages/Cases'
import Pipeline from './pages/Pipeline'
import Reports from './pages/Reports'
import EOS from './pages/EOS'
import Automations from './pages/Automations'
import Users from './pages/Users'
import Help from './pages/Help'
import SchedulerDashboard from './pages/scheduler/Dashboard'
import SchedulerCalendar from './pages/scheduler/Calendar'
import SchedulerAppointments from './pages/scheduler/Appointments'
import SchedulerAvailability from './pages/scheduler/Availability'
import SchedulerIntegrations from './pages/scheduler/Integrations'
import SchedulerAnalytics from './pages/scheduler/Analytics'
import SchedulerWorkflows from './pages/scheduler/Workflows'
import SchedulerEventEditor from './pages/scheduler/EventEditor'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center text-gray-400">
      <div className="w-8 h-8 border-2 border-[#06babe] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm">Loading...</p>
    </div>
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Layout><PageTransition>{children}</PageTransition></Layout>
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Layout><PageTransition>{children}</PageTransition></Layout>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"       element={<PageTransition><Login /></PageTransition>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leads"       element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/clients"     element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/clinics"     element={<ProtectedRoute><Clinics /></ProtectedRoute>} />
        <Route path="/cases"       element={<ProtectedRoute><Cases /></ProtectedRoute>} />
        <Route path="/pipeline"    element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
        <Route path="/reports"     element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/eos"         element={<ProtectedRoute><EOS /></ProtectedRoute>} />
        <Route path="/help"        element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/automations" element={<AdminRoute><Automations /></AdminRoute>} />
        <Route path="/users"       element={<AdminRoute><Users /></AdminRoute>} />

        {/* Scheduler — embedded in CRM */}
        <Route path="/scheduler"                        element={<ProtectedRoute><SchedulerDashboard /></ProtectedRoute>} />
        <Route path="/scheduler/calendar"               element={<ProtectedRoute><SchedulerCalendar /></ProtectedRoute>} />
        <Route path="/scheduler/appointments"           element={<ProtectedRoute><SchedulerAppointments /></ProtectedRoute>} />
        <Route path="/scheduler/availability"           element={<ProtectedRoute><SchedulerAvailability /></ProtectedRoute>} />
        <Route path="/scheduler/integrations"           element={<ProtectedRoute><SchedulerIntegrations /></ProtectedRoute>} />
        <Route path="/scheduler/analytics"              element={<ProtectedRoute><SchedulerAnalytics /></ProtectedRoute>} />
        <Route path="/scheduler/workflows"              element={<ProtectedRoute><SchedulerWorkflows /></ProtectedRoute>} />
        <Route path="/scheduler/event-types/new"        element={<ProtectedRoute><SchedulerEventEditor /></ProtectedRoute>} />
        <Route path="/scheduler/event-types/edit/:id"   element={<ProtectedRoute><SchedulerEventEditor /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
