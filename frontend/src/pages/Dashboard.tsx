import { useQuery } from 'react-query'
import { apiClient } from '../api/client'
import { Mail, Users, List, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const { data, isLoading } = useQuery('dashboard-stats', async () => {
    const response = await apiClient.get('/stats/dashboard')
    return response.data
  })

  if (isLoading) {
    return <div>Lädt...</div>
  }

  const stats = data?.overview || {}
  const dailyStats = data?.dailyStats || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Statistik-Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kontakte</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalContacts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <List className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Listen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLists || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Versendet (30 Tage)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sentLast30Days || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Öffnungsrate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.openRate ? `${stats.openRate}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Aktivität der letzten 30 Tage
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
            />
            <Bar dataKey="sent" fill="#3b82f6" name="Versendet" />
            <Bar dataKey="opens" fill="#10b981" name="Geöffnet" />
            <Bar dataKey="clicks" fill="#f59e0b" name="Geklickt" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

