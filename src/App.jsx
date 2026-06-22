import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
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
import Automations from './pages/Automations'
import Users from './pages/Users'

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
        <Route path="/automations" element={<AdminRoute><Automations /></AdminRoute>} />
        <Route path="/users"       element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
