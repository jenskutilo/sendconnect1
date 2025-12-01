import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '../api/client'
import toast from 'react-hot-toast'
import { Plus, Server, Trash2, Mail, X } from 'lucide-react'

export default function SmtpProfiles() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 587,
    secure: false,
    authUser: '',
    authPass: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    rateLimit: 100,
    isDefault: false,
  })

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

  const createMutation = useMutation(
    (data: any) => apiClient.post('/smtp', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('smtp-profiles')
        toast.success('SMTP-Profil erstellt')
        setShowForm(false)
        setFormData({
          name: '',
          host: '',
          port: 587,
          secure: false,
          authUser: '',
          authPass: '',
          fromName: '',
          fromEmail: '',
          replyTo: '',
          rateLimit: 100,
          isDefault: false,
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Erstellen des Profils')
      },
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.put(`/smtp/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('smtp-profiles')
        toast.success('SMTP-Profil aktualisiert')
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: '',
          host: '',
          port: 587,
          secure: false,
          authUser: '',
          authPass: '',
          fromName: '',
          fromEmail: '',
          replyTo: '',
          rateLimit: 100,
          isDefault: false,
        })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Fehler beim Aktualisieren des Profils')
      },
    }
  )

  const handleEdit = (profile: any) => {
    setEditingId(profile.id)
    setFormData({
      name: profile.name,
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      authUser: profile.authUser || '',
      authPass: '', // Passwort nicht anzeigen
      fromName: profile.fromName || '',
      fromEmail: profile.fromEmail,
      replyTo: profile.replyTo || '',
      rateLimit: profile.rateLimit || 100,
      isDefault: profile.isDefault || false,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const profiles = data || []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SMTP-Profile</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({
              name: '',
              host: '',
              port: 587,
              secure: false,
              authUser: '',
              authPass: '',
              fromName: '',
              fromEmail: '',
              replyTo: '',
              rateLimit: 100,
              isDefault: false,
            })
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neues Profil
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingId ? 'SMTP-Profil bearbeiten' : 'Neues SMTP-Profil'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Host *</label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Port *</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Benutzername *</label>
                  <input
                    type="text"
                    required
                    value={formData.authUser}
                    onChange={(e) => setFormData({ ...formData, authUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passwort *</label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.authPass}
                    onChange={(e) => setFormData({ ...formData, authPass: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder={editingId ? "Leer lassen um nicht zu ändern" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Von E-Mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Von Name</label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Antwort an</label>
                  <input
                    type="email"
                    value={formData.replyTo}
                    onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate Limit (Mails/Stunde)</label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.secure}
                    onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">SSL/TLS verwenden</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Als Standard markieren</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  onClick={() => handleEdit(profile)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Bearbeiten
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

