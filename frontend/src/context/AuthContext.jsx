import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContext.js'
import api, { TOKEN_STORAGE_KEY } from '../services/api.js'

function persistSession({ token, user }, setUser) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  setUser(user)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/user')
        if (active) {
          setUser(response.data.data ?? response.data)
        }
      } catch {
        if (active) {
          if (!window.localStorage.getItem(TOKEN_STORAGE_KEY)) {
            setUser(null)
          } else {
            setSessionError('Could not verify your saved session. Check that the API is available and sign in again.')
          }
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/login', credentials)
    persistSession(response.data, setUser)
    setSessionError('')
    return response.data.user
  }, [])

  const register = useCallback(async (details) => {
    const response = await api.post('/register', details)
    persistSession(response.data, setUser)
    setSessionError('')
    return response.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token: window.localStorage.getItem(TOKEN_STORAGE_KEY),
      login,
      logout,
      register,
      loading,
      sessionError,
    }),
    [user, login, logout, register, loading, sessionError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
