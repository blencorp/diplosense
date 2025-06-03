'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Activity, Zap, Clock, AlertTriangle, Download, Eye } from 'lucide-react'

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

  const exportData = async () => {
    try {
      const response = await fetch('/api/v1/usage/export')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diplosense-usage-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting data:', err)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Usage Statistics...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Usage Statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DiploSense Usage</h1>
              <p className="text-blue-200">API Usage Analytics & Cost Tracking</p>
            </div>
            <nav className="flex gap-4">
              <a href="/" className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors">
                Video Analysis
              </a>
              <a href="/live" className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors">
                Live Camera
              </a>
              <a href="/usage" className="px-4 py-2 bg-blue-800 rounded-md hover:bg-blue-700 transition-colors">
                Usage Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
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
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Recent Errors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.recent_errors?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Service Breakdown</h2>
              <button
                onClick={exportData}
                className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="space-y-4">
              {stats?.service_stats?.map((service: ServiceStat, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded ${getServiceColor(service.service)}`}>
                      {service.service.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{service.request_count} requests</p>
                      <p className="text-xs text-gray-500">{formatNumber(service.total_tokens)} tokens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(service.total_cost)}</p>
                    <p className="text-xs text-gray-500">{service.avg_response_time?.toFixed(0)}ms avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.recent_requests?.slice(0, 20).map((request: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => openRequestModal(request)}
                >
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded ${getServiceColor(request.service)}`}>
                      {request.service?.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{request.model_used}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.request_timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-2">
                      <p className="text-sm">{formatCurrency(request.estimated_cost_usd)}</p>
                      <p className="text-xs text-gray-500">{request.tokens_total} tokens</p>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        {stats?.recent_errors && stats.recent_errors.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Recent Errors
            </h2>
            <div className="space-y-3">
              {stats.recent_errors.map((error: any, index: number) => (
                <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">{error.service} Error</p>
                      <p className="text-xs text-red-600">{error.error_message}</p>
                    </div>
                    <p className="text-xs text-red-500">
                      {new Date(error.request_timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Request Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Request Details - {selectedRequest.service}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Request Info</h3>
                  <p className="text-sm text-gray-600">Model: {selectedRequest.model_used}</p>
                  <p className="text-sm text-gray-600">Timestamp: {new Date(selectedRequest.request_timestamp).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Response Time: {selectedRequest.response_time_ms}ms</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Usage & Cost</h3>
                  <p className="text-sm text-gray-600">Tokens: {selectedRequest.tokens_total}</p>
                  <p className="text-sm text-gray-600">Cost: {formatCurrency(selectedRequest.estimated_cost_usd)}</p>
                  <p className="text-sm text-gray-600">Status: {selectedRequest.status_code}</p>
                </div>
              </div>
              
              {selectedRequest.error_message && (
                <div className="mb-4 p-3 bg-red-50 rounded">
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700">{selectedRequest.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}