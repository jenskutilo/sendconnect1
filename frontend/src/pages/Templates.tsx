import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Plus, FileText } from 'lucide-react'

export default function Templates() {
  const { data, isLoading } = useQuery('templates', async () => {
    const response = await apiClient.get('/templates')
    return response.data
  })

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const templates = data || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
        <Link
          to="/templates/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neues Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            Keine Templates gefunden
          </div>
        ) : (
          templates.map((template: any) => (
            <div
              key={template.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold ml-3">{template.name}</h3>
              </div>
              {template.subject && (
                <p className="text-sm text-gray-600 mb-2">Betreff: {template.subject}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

