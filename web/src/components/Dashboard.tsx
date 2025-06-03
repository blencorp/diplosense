'use client'

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertTriangle, Users, Brain, FileText } from 'lucide-react'
import NoSSR from './NoSSR'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface DashboardProps {
  analysisData: AnalysisData[]
  meetingId: string
}

const Dashboard: React.FC<DashboardProps> = ({ analysisData, meetingId }) => {
  const emotionData = useMemo(() => {
    return analysisData
      .filter(item => item.type === 'audio_analysis' && item.data.emotion_score !== undefined)
      .map((item, index) => ({
        time: index + 1,
        emotion: item.data.emotion_score,
        stress: item.data.stress_level,
        timestamp: new Date(item.timestamp).toLocaleTimeString()
      }))
  }, [analysisData])

  const facialData = useMemo(() => {
    const facial = analysisData.filter(item => item.type === 'facial_analysis')
    if (facial.length === 0) return []
    
    const latest = facial[facial.length - 1]
    return latest.data.emotions?.map((emotion: any) => ({
      emotion: emotion.emotion,
      confidence: emotion.confidence * 100
    })) || []
  }, [analysisData])

  const latestCable = useMemo(() => {
    const cables = analysisData.filter(item => item.type === 'diplomatic_cable')
    return cables.length > 0 ? cables[cables.length - 1].data : null
  }, [analysisData])

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Emotion Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {emotionData.length > 0 ? emotionData[emotionData.length - 1].emotion.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stress Level</p>
              <p className="text-2xl font-semibold text-gray-900">
                {emotionData.length > 0 ? (emotionData[emotionData.length - 1].stress * 100).toFixed(0) + '%' : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Risk Level</p>
              <p className={`text-lg font-semibold px-2 py-1 rounded ${getRiskColor(latestCable?.risk_assessment?.risk_level)}`}>
                {latestCable?.risk_assessment?.risk_level || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Timeline */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Negotiation Temperature</h3>
        <NoSSR fallback={<div className="h-[300px] flex items-center justify-center text-gray-500">Loading chart...</div>}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[-1, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="emotion" stroke="#2563eb" strokeWidth={2} name="Emotion Score" />
              <Line type="monotone" dataKey="stress" stroke="#dc2626" strokeWidth={2} name="Stress Level" />
            </LineChart>
          </ResponsiveContainer>
        </NoSSR>
      </div>

      {/* Facial Expressions */}
      {facialData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Facial Expressions</h3>
          <NoSSR fallback={<div className="h-[200px] flex items-center justify-center text-gray-500">Loading chart...</div>}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={facialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="emotion" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="confidence" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </NoSSR>
        </div>
      )}

      {/* Diplomatic Cable */}
      {latestCable && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 ml-2">Latest Diplomatic Assessment</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Executive Summary</h4>
              <p className="text-gray-700 mt-1">{latestCable.executive_summary}</p>
            </div>

            {latestCable.risk_assessment && (
              <div>
                <h4 className="font-medium text-gray-900">Risk Assessment</h4>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Risk Level:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getRiskColor(latestCable.risk_assessment.risk_level)}`}>
                      {latestCable.risk_assessment.risk_level}
                    </span>
                  </p>
                  {latestCable.risk_assessment.recommendations && (
                    <div>
                      <p className="font-medium text-sm text-gray-900">Recommendations:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {Array.isArray(latestCable.risk_assessment.recommendations) 
                          ? latestCable.risk_assessment.recommendations.map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))
                          : <li>{latestCable.risk_assessment.recommendations}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {latestCable.cultural_analysis && (
              <div>
                <h4 className="font-medium text-gray-900">Cultural Context</h4>
                <div className="mt-2 text-sm text-gray-600">
                  {latestCable.cultural_analysis.cultural_insights && (
                    <p>{JSON.stringify(latestCable.cultural_analysis.cultural_insights)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis Activity</h3>
        <div className="space-y-2">
          {analysisData.slice(-5).reverse().map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard