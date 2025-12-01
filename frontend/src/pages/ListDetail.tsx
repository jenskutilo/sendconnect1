import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { apiClient } from '../api/client'

export default function ListDetail() {
  const { id } = useParams()

  const { data, isLoading } = useQuery(
    ['list', id],
    async () => {
      const response = await apiClient.get(`/lists/${id}`)
      return response.data
    }
  )

  if (isLoading) {
    return <div>Lädt...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{data.name}</h1>
      <p className="text-gray-600 mb-8">{data.description || 'Keine Beschreibung'}</p>
      <p className="text-sm text-gray-500">
        {data._count?.contacts || 0} Kontakte
      </p>
    </div>
  )
}

