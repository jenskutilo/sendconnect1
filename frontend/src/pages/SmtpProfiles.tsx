import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'
import { Plus, Server, Trash2, Mail } from 'lucide-react'

export default function SmtpProfiles() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')

  const { data, isLoading } = useQuery('smtp-profiles', async () => {
    const response = await apiClient.get('/smtp')
    return response.data
  })

  const deleteMutation = useMutation(
    (id: string) => apiClient.delete(`/smtp/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('smtp-profiles')
        toast.success('SMTP-Profil gelöscht')
      },
    }
  )

  const testMutation = useMutation(
    ({ id, email }: { id: string; email: string }) =>
      apiClient.post(`/smtp/${id}/test`, { to: email }),
    {
      onSuccess: () => {
        toast.success('Test-Mail gesendet')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Senden der Test-Mail')
      },
    }
  )

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const profiles = data || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SMTP-Profile</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neues Profil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            Keine SMTP-Profile gefunden
          </div>
        ) : (
          profiles.map((profile: any) => (
            <div key={profile.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Server className="w-8 h-8 text-blue-600" />
                <div className="ml-3 flex-1">
                  <h3 className="text-xl font-bold">{profile.name}</h3>
                  {profile.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Standard
                    </span>
                  )}
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <dt className="font-medium">Host</dt>
                <dd className="text-gray-600">{profile.host}:{profile.port}</dd>
                <dt className="font-medium">Von</dt>
                <dd className="text-gray-600">
                  {profile.fromName} &lt;{profile.fromEmail}&gt;
                </dd>
                <dt className="font-medium">Rate Limit</dt>
                <dd className="text-gray-600">{profile.rateLimit} Mails/Stunde</dd>
              </dl>
              <div className="mt-4 flex space-x-2">
                <input
                  type="email"
                  placeholder="Test-E-Mail"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={() => testMutation.mutate({ id: profile.id, email: testEmail })}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(profile.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

