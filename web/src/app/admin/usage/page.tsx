'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Activity, Zap, Clock, AlertTriangle, Download, Eye } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'

interface UsageStats {
  total_requests: number
  total_cost_usd: number
  total_tokens: number
  recent_requests: any[]
  service_stats: any[]
  recent_errors: any[]
}

interface ServiceStat {
  service: string
  request_count: number
  total_cost: number
  total_tokens: number
  avg_response_time: number
}

export default function UsagePage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/usage/stats')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load usage statistics')
      console.error('Error fetching usage stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/usage/export')
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diplosense-usage-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getServiceColor = (service: string) => {
    const colors = {
      'openai_vision': 'bg-blue-100 text-blue-800',
      'openai_whisper': 'bg-green-100 text-green-800',
      'openai_chat': 'bg-purple-100 text-purple-800'
    }
    return colors[service as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const openRequestModal = (request: any) => {
    setSelectedRequest(request)
    setShowModal(true)
  }

  if (!mounted) {
    return (
      <AdminLayout title="Usage Analytics">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Usage Statistics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout title="Usage Analytics">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Usage Statistics...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Usage Analytics">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchUsageStats}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Usage Analytics">
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats?.total_cost_usd || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats?.total_requests || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats?.total_tokens || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Cost/Request</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency((stats?.total_cost_usd || 0) / Math.max(1, stats?.total_requests || 1))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Service Breakdown</h3>
            </div>
            <div className="p-6">
              {stats?.service_stats && stats.service_stats.length > 0 ? (
                <div className="space-y-4">
                  {stats.service_stats.map((service: ServiceStat, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getServiceColor(service.service)}`}>
                          {service.service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <div className="text-sm text-gray-600">
                          {service.request_count} requests
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(service.total_cost)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(service.total_tokens)} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No service data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="p-6">
              {stats?.recent_requests && stats.recent_requests.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_requests.slice(0, 10).map((request: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => openRequestModal(request)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getServiceColor(request.service)}`}>
                          {request.service}
                        </span>
                        <div className="text-sm">
                          <div className="font-medium">{request.model}</div>
                          <div className="text-gray-500">{request.tokens} tokens</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm">
                          <div className="font-medium">{formatCurrency(request.cost)}</div>
                          <div className="text-gray-500">{Math.round(request.response_time_ms)}ms</div>
                        </div>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent requests</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Log */}
        {stats?.recent_errors && stats.recent_errors.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.recent_errors.map((error: any, index: number) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-800">{error.service}</span>
                      <span className="text-xs text-red-600">{new Date(error.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-red-700">{error.error}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Service</p>
                  <p className="text-lg">{selectedRequest.service}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Model</p>
                  <p className="text-lg">{selectedRequest.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tokens</p>
                  <p className="text-lg">{selectedRequest.tokens}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cost</p>
                  <p className="text-lg">{formatCurrency(selectedRequest.cost)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Response Time</p>
                  <p className="text-lg">{Math.round(selectedRequest.response_time_ms)}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="text-sm text-gray-600">{new Date(selectedRequest.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedRequest.error && (
                <div className="mb-4 p-3 bg-red-50 rounded">
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700">{selectedRequest.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}