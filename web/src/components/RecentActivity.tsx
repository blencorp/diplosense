'use client'

import React, { useState } from 'react'
import { Eye, X } from 'lucide-react'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface RecentActivityProps {
  analysisData: AnalysisData[]
}

const RecentActivity: React.FC<RecentActivityProps> = ({ analysisData }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (analysis: AnalysisData) => {
    console.log('Opening modal for:', analysis.type)
    setSelectedAnalysis(analysis)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedAnalysis(null)
    setIsModalOpen(false)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'facial_analysis': return 'Facial Analysis'
      case 'audio_analysis': return 'Audio Analysis'
      case 'demo_analysis': return 'Demo Analysis'
      case 'diplomatic_cable': return 'Diplomatic Cable'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial_analysis': return 'bg-blue-100 text-blue-800'
      case 'audio_analysis': return 'bg-green-100 text-green-800'
      case 'demo_analysis': return 'bg-purple-100 text-purple-800'
      case 'diplomatic_cable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Analysis Activity</h3>
          <button 
            onClick={() => {
              console.log('Test button clicked')
              if (analysisData.length > 0) {
                openModal(analysisData[analysisData.length - 1])
              }
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Test Modal
          </button>
        </div>
        <div className="space-y-2">
          {analysisData.slice(-5).reverse().map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => openModal(item)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {item.type === 'facial_analysis' && item.data.emotions ? 
                    `Detected: ${item.data.emotions.map((e: any) => e.emotion).join(', ')}` :
                    item.type === 'audio_analysis' && item.data.transcript ?
                    `"${item.data.transcript.substring(0, 50)}..."` :
                    item.type === 'demo_analysis' && item.data.overall_assessment ?
                    `Tension: ${item.data.overall_assessment.tension_level}` :
                    'Analysis complete'
                  }
                </p>
              </div>
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
          ))}
          {analysisData.length === 0 && (
            <p className="text-gray-500 text-center py-8">No analysis data yet</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {getTypeLabel(selectedAnalysis.type)} Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Timestamp: {new Date(selectedAnalysis.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Meeting ID: {selectedAnalysis.meeting_id}
                </p>
              </div>
              
              {selectedAnalysis.type === 'facial_analysis' && selectedAnalysis.data.emotions && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Detected Emotions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAnalysis.data.emotions.map((emotion: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900 capitalize">
                          {emotion.emotion}
                        </p>
                        <p className="text-blue-700 text-sm">
                          Confidence: {(emotion.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedAnalysis.type === 'demo_analysis' && selectedAnalysis.data.overall_assessment && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Assessment Summary</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium text-yellow-900">
                      Tension Level: <span className="capitalize">{selectedAnalysis.data.overall_assessment.tension_level}</span>
                    </p>
                    <p className="text-yellow-800 mt-1">
                      Cooperation Probability: {(selectedAnalysis.data.overall_assessment.cooperation_probability * 100).toFixed(0)}%
                    </p>
                    {selectedAnalysis.data.overall_assessment.key_insights && (
                      <div className="mt-3">
                        <p className="font-medium text-yellow-900">Key Insights:</p>
                        <ul className="list-disc list-inside text-yellow-800 mt-1">
                          {selectedAnalysis.data.overall_assessment.key_insights.map((insight: string, idx: number) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedAnalysis.type === 'diplomatic_cable' && (
                <div className="mt-6 space-y-4">
                  {selectedAnalysis.data.executive_summary && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Executive Summary</h3>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-800">{selectedAnalysis.data.executive_summary}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedAnalysis.data.risk_assessment && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Risk Assessment</h3>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="font-medium text-orange-900">
                          Risk Level: {selectedAnalysis.data.risk_assessment.risk_level}
                        </p>
                        {selectedAnalysis.data.risk_assessment.recommendations && (
                          <div className="mt-2">
                            <p className="font-medium text-orange-900">Recommendations:</p>
                            <ul className="list-disc list-inside text-orange-800 mt-1">
                              {Array.isArray(selectedAnalysis.data.risk_assessment.recommendations) 
                                ? selectedAnalysis.data.risk_assessment.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  ))
                                : <li>{selectedAnalysis.data.risk_assessment.recommendations}</li>
                              }
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentActivity