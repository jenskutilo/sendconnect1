import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, refetch } = useQuery(
    ['campaign', id],
    async () => {
      const response = await apiClient.get(`/campaigns/${id}`)
      return response.data
    }
  )

  const handleStart = async () => {
    try {
      await apiClient.post(`/campaigns/${id}/start`)
      toast.success('Kampagne gestartet')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Starten')
    }
  }

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const campaign = data

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
        <div className="space-x-2">
          {campaign.status === 'DRAFT' && (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Kampagne starten
            </button>
          )}
          <button
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Zurück
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Details</h2>
          <dl className="space-y-2">
            <dt className="font-medium">Status</dt>
            <dd className="text-gray-600">{campaign.status}</dd>
            <dt className="font-medium">Betreff</dt>
            <dd className="text-gray-600">{campaign.subject}</dd>
            <dt className="font-medium">Von</dt>
            <dd className="text-gray-600">
              {campaign.fromName} &lt;{campaign.fromEmail}&gt;
            </dd>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Statistiken</h2>
          <dl className="space-y-2">
            <dt className="font-medium">Versendet</dt>
            <dd className="text-gray-600">{campaign._count?.sends || 0}</dd>
            <dt className="font-medium">Geöffnet</dt>
            <dd className="text-gray-600">{campaign._count?.opens || 0}</dd>
            <dt className="font-medium">Geklickt</dt>
            <dd className="text-gray-600">{campaign._count?.clicks || 0}</dd>
            <dt className="font-medium">Bounces</dt>
            <dd className="text-gray-600">{campaign._count?.bounces || 0}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">HTML-Vorschau</h2>
        <div
          className="border border-gray-200 rounded p-4"
          dangerouslySetInnerHTML={{ __html: campaign.htmlContent }}
        />
      </div>
    </div>
  )
}

