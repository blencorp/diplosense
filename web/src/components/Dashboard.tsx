'use client'

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertTriangle, Users, Brain, FileText, Video, Play } from 'lucide-react'
import NoSSR from './NoSSR'
import VideoPlayer from './VideoPlayer'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface DashboardProps {
  analysisData: AnalysisData[]
  meetingId: string
  currentVideo?: string
  isAnalyzing?: boolean
  analysisProgress?: number
  onVideoPlay?: () => void
  onVideoPause?: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ 
  analysisData, 
  meetingId, 
  currentVideo, 
  isAnalyzing = false, 
  analysisProgress = 0,
  onVideoPlay,
  onVideoPause
}) => {
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
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

  const handleVideoTimeUpdate = (currentTime: number) => {
    setVideoCurrentTime(currentTime)
  }

  const handleVideoLoadedData = (duration: number) => {
    setVideoDuration(duration)
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      {currentVideo ? (
        <VideoPlayer
          videoUrl={currentVideo}
          isAnalyzing={isAnalyzing}
          analysisProgress={analysisProgress}
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedData={handleVideoLoadedData}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative">
                <Video className="h-16 w-16 text-gray-400 mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-6 w-6 text-gray-500 ml-1" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-600">No Video Selected</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Select a demo video from the left panel or upload your own video to begin real-time diplomatic analysis.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Facial Expression Analysis
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Audio Transcription
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Cultural Context
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Ready for analysis</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                Waiting for video
              </span>
            </div>
          </div>
        </div>
      )}

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

    </div>
  )
}

export default Dashboard