'use client'

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertTriangle, Users, Brain, FileText, X, Eye } from 'lucide-react'
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
  const emotionData = useMemo(() => {
    const processedData: Array<{time: number, emotion: number, stress: number, timestamp: string}> = []
    
    analysisData.forEach((item, index) => {
      let emotion = 0
      let stress = 0
      
      if (item.type === 'audio_analysis' && item.data.emotion_score !== undefined) {
        emotion = item.data.emotion_score
        stress = item.data.stress_level || 0
      } else if (item.type === 'facial_analysis') {
        if (item.data.emotions && Array.isArray(item.data.emotions)) {
          const emotions = item.data.emotions
          const positiveEmotions = ['happy', 'surprise', 'joy', 'confident', 'content', 'calm', 'pleased', 'satisfied']
          const negativeEmotions = ['sad', 'angry', 'fear', 'disgust', 'stressed', 'frustrated', 'worried', 'anxious', 'tense']
          
          let positiveScore = 0
          let negativeScore = 0
          
          emotions.forEach((emo: any) => {
            if (emo.emotion && emo.confidence !== undefined) {
              if (positiveEmotions.includes(emo.emotion.toLowerCase())) {
                positiveScore += emo.confidence
              } else if (negativeEmotions.includes(emo.emotion.toLowerCase())) {
                negativeScore += emo.confidence
              }
            }
          })
          
          emotion = positiveScore - negativeScore
          stress = negativeScore > 0.3 ? negativeScore : 0.1
        } else {
          emotion = 0.1
          stress = 0.2
        }
      } else if (item.type === 'demo_analysis' && item.data.overall_assessment) {
        // Extract emotion and stress from demo analysis
        const assessment = item.data.overall_assessment
        const tensionLevel = assessment.tension_level
        
        if (tensionLevel?.toLowerCase() === 'low') {
          emotion = 0.5
          stress = 0.2
        } else if (tensionLevel?.toLowerCase() === 'moderate') {
          emotion = 0.1
          stress = 0.5
        } else if (tensionLevel?.toLowerCase() === 'high') {
          emotion = -0.5
          stress = 0.8
        } else {
          emotion = 0.1
          stress = 0.3
        }
      }
      
      if (emotion !== 0 || stress !== 0) {
        processedData.push({
          time: processedData.length + 1,
          emotion,
          stress,
          timestamp: new Date(item.timestamp).toLocaleTimeString()
        })
      }
    })
    
    return processedData
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
    // Check for diplomatic cables first
    const cables = analysisData.filter(item => item.type === 'diplomatic_cable')
    if (cables.length > 0) {
      return cables[cables.length - 1].data
    }
    
    // Fallback to demo analysis for risk assessment
    const demoAnalysis = analysisData.filter(item => item.type === 'demo_analysis')
    if (demoAnalysis.length > 0) {
      const latest = demoAnalysis[demoAnalysis.length - 1].data
      
      // Create a cable-like structure from demo analysis
      return {
        executive_summary: latest.overall_assessment?.key_insights?.join('. ') || 'Demo analysis in progress',
        risk_assessment: {
          risk_level: latest.overall_assessment?.tension_level === 'low' ? 'Low' : 
                     latest.overall_assessment?.tension_level === 'moderate' ? 'Medium' : 'High',
          recommendations: latest.cultural_dynamics?.recommended_adjustments || []
        },
        cultural_analysis: {
          cultural_insights: latest.cultural_dynamics
        }
      }
    }
    
    return null
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
              className="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer rounded px-2 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                openModal(item)
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Details Modal */}
      {isModalOpen && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedAnalysis.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Details
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Meeting ID: {selectedAnalysis.meeting_id}</p>
                <p className="text-sm text-gray-500">Timestamp: {new Date(selectedAnalysis.timestamp).toLocaleString()}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Analysis Data</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(selectedAnalysis.data, null, 2)}
                </pre>
              </div>
              
              {selectedAnalysis.type === 'facial_analysis' && selectedAnalysis.data.emotions && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Detected Emotions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedAnalysis.data.emotions.map((emotion: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900 capitalize">{emotion.emotion}</p>
                        <p className="text-sm text-blue-700">
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

export default Dashboard