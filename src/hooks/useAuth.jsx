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
    const init = async () => {
      const token = api.getToken()
      if (token) {
        const payload = decodeToken(token)
        if (payload && payload.exp * 1000 > Date.now()) {
          setUser(payload)
          try {
            const { user: full } = await api.get('/api/auth/me')
            setUser(full)
          } catch {}
        } else {
          api.clearToken()
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (email, password) => {
    try {
      const { token, user: userData } = await api.post('/api/auth/login', { email, password })
      api.setToken(token)
      setUser(userData)
      try {
        const { user: full } = await api.get('/api/auth/me')
        setUser(full)
      } catch {}
      return { error: null }
    } catch (err) {
      return { error: { message: err.message || 'Invalid email or password' } }
    }
  }

  const signOut = () => {
    api.clearToken()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const { user: full } = await api.get('/api/auth/me')
      setUser(full)
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
