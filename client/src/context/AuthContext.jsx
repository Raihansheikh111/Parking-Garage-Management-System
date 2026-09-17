import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuthSession, getStoredUser, setAuthSession } from '../services/auth.service.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => localStorage.getItem('pms_token'))

  useEffect(() => {
    if (token && user) {
      setAuthSession({ token, user })
    }
  }, [token, user])

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken)
    setUser(nextUser)
    setAuthSession({ token: nextToken, user: nextUser })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    clearAuthSession()
  }

  const value = useMemo(() => ({ user, token, login, logout, isAuthenticated: Boolean(token) }), [user, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
