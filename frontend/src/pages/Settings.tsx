import { useQuery } from 'react-query'
import { apiClient } from '../api/client'

export default function Settings() {
  const { data, isLoading } = useQuery('settings', async () => {
    const response = await apiClient.get('/settings')
    return response.data
  })

  if (isLoading) {
    return <div>Lädt...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Einstellungen</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Einstellungen werden hier angezeigt</p>
      </div>
    </div>
  )
}

