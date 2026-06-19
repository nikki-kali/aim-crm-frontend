import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
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
  return <Layout>{children}</Layout>
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads"       element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/clients"     element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/cases"       element={<ProtectedRoute><Cases /></ProtectedRoute>} />
          <Route path="/pipeline"    element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/reports"     element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/automations" element={<AdminRoute><Automations /></AdminRoute>} />
          <Route path="/users"       element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
