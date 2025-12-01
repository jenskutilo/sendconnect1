import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiClient } from '../api/client'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'ADMIN' | 'USER'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken')

  const { data, isLoading, error } = useQuery(
    'me',
    async () => {
      const response = await apiClient.get('/auth/me')
      return response.data
    },
    {
      retry: false,
      enabled: hasToken, // Nur ausführen wenn Token vorhanden
      onError: (err: any) => {
        // Nur bei 401 (Unauthorized) user auf null setzen, nicht bei 429 (Rate Limit)
        if (err?.response?.status === 401) {
          setUser(null)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      },
    }
  )

  useEffect(() => {
    if (!hasToken) {
      setUser(null)
      setLoading(false)
      return
    }

    if (data) {
      setUser(data)
    }
    
    if (error && (error as any)?.response?.status !== 429) {
      // Bei 429 Fehler nicht user auf null setzen, nur bei anderen Fehlern
      if ((error as any)?.response?.status === 401) {
        setUser(null)
      }
    }
    
    setLoading(isLoading)
  }, [data, isLoading, error, hasToken])

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = response.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return { user, loading, login, logout }
}

