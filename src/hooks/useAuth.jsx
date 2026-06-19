import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext({})

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      const payload = decodeToken(token)
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser(payload)
      } else {
        api.clearToken()
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    try {
      const { token, user: userData } = await api.post('/api/auth/login', { email, password })
      api.setToken(token)
      setUser(userData)
      return { error: null }
    } catch (err) {
      return { error: { message: err.message || 'Invalid email or password' } }
    }
  }

  const signOut = () => {
    api.clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
