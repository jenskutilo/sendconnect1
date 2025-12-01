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

  const { data, isLoading } = useQuery(
    'me',
    async () => {
      const response = await apiClient.get('/auth/me')
      return response.data
    },
    {
      retry: false,
      onError: () => {
        setUser(null)
      },
    }
  )

  useEffect(() => {
    if (data) {
      setUser(data)
    }
    setLoading(isLoading)
  }, [data, isLoading])

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

