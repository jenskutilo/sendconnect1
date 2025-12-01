import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

export default function CampaignCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    listId: '',
    subject: '',
    subjectRotation: [] as string[],
    fromName: '',
    fromEmail: '',
    fromRotation: [] as Array<{ name: string; email: string }>,
    htmlContent: '',
    textContent: '',
    preheader: '',
    scheduledAt: '',
  })

  const { data: lists } = useQuery('lists', async () => {
    const response = await apiClient.get('/lists')
    return response.data
  })

  const { data: templates } = useQuery('templates', async () => {
    const response = await apiClient.get('/templates')
    return response.data
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.post('/campaigns', {
        ...formData,
        scheduledAt: formData.scheduledAt || undefined,
        subjectRotation: formData.subjectRotation.length > 0 ? formData.subjectRotation : undefined,
        fromRotation: formData.fromRotation.length > 0 ? formData.fromRotation : undefined,
      })
      toast.success('Kampagne erstellt')
      navigate('/campaigns')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Erstellen der Kampagne')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Neue Kampagne</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Liste</label>
          <select
            value={formData.listId}
            onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Bitte wählen</option>
            {lists?.map((list: any) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Betreff</label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Absendername</label>
          <input
            type="text"
            required
            value={formData.fromName}
            onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Absender-E-Mail</label>
          <input
            type="email"
            required
            value={formData.fromEmail}
            onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">HTML-Inhalt</label>
          <textarea
            required
            rows={10}
            value={formData.htmlContent}
            onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="HTML-Inhalt mit Platzhaltern wie {{first_name}}, {{unsubscribe_link}}"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Text-Inhalt (optional)</label>
          <textarea
            rows={5}
            value={formData.textContent}
            onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Erstelle...' : 'Kampagne erstellen'}
          </button>
        </div>
      </form>
    </div>
  )
}

