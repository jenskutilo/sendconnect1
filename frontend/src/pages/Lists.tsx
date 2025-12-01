import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Plus, List as ListIcon } from 'lucide-react'

export default function Lists() {
  const { data, isLoading } = useQuery('lists', async () => {
    const response = await apiClient.get('/lists')
    return response.data
  })

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const lists = data || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Listen</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />
          Neue Liste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            Keine Listen gefunden
          </div>
        ) : (
          lists.map((list: any) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <ListIcon className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold ml-3">{list.name}</h3>
              </div>
              <p className="text-gray-600 mb-2">{list.description || 'Keine Beschreibung'}</p>
              <p className="text-sm text-gray-500">
                {list._count?.contacts || 0} Kontakte
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

