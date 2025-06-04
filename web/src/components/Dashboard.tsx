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
      } else if (item.type === 'audio_analysis' && item.data.emotion_analysis) {
        // Handle audio analysis with translation support
        const emotionAnalysis = item.data.emotion_analysis
        emotion = emotionAnalysis.emotion_score || 0
        stress = emotionAnalysis.stress_level || 0
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

  // Function to analyze transcript content for risk indicators
  const analyzeTranscriptRisk = (transcript: string): { level: string, reasons: string[] } => {
    if (!transcript || transcript.trim().length === 0) {
      return { level: 'Low', reasons: ['No transcript available'] }
    }
    
    const text = transcript.toLowerCase()
    let riskScore = 0
    const reasons: string[] = []
    
    // High-risk keywords and phrases
    const highRiskIndicators = [
      { words: ['threat', 'threaten', 'warning', 'consequences'], weight: 3, reason: 'Threats detected' },
      { words: ['reject', 'refuse', 'unacceptable', 'impossible'], weight: 2, reason: 'Strong rejection language' },
      { words: ['sanctions', 'retaliation', 'punishment'], weight: 3, reason: 'Punitive measures mentioned' },
      { words: ['withdraw', 'suspend', 'terminate'], weight: 2, reason: 'Withdrawal language' },
      { words: ['deadline', 'ultimatum', 'final'], weight: 2, reason: 'Time pressure language' },
      { words: ['escalate', 'escalation', 'military'], weight: 3, reason: 'Escalation indicators' },
      { words: ['angry', 'furious', 'outraged'], weight: 2, reason: 'Strong emotional language' },
      { words: ['war', 'conflict', 'hostilities'], weight: 3, reason: 'Conflict terminology' }
    ]
    
    // Medium-risk indicators
    const mediumRiskIndicators = [
      { words: ['concern', 'worried', 'troubled'], weight: 1, reason: 'Concerns expressed' },
      { words: ['disagree', 'object', 'oppose'], weight: 1, reason: 'Opposition stated' },
      { words: ['disappointed', 'frustrated'], weight: 1, reason: 'Negative emotions' },
      { words: ['reconsider', 'review', 'reassess'], weight: 1, reason: 'Position uncertainty' },
      { words: ['pressure', 'force', 'compel'], weight: 1, reason: 'Coercive language' },
      { words: ['crisis', 'emergency', 'urgent'], weight: 2, reason: 'Crisis language' }
    ]
    
    // Positive indicators (reduce risk)
    const positiveIndicators = [
      { words: ['cooperation', 'collaborate', 'partnership'], weight: -1, reason: 'Cooperative language' },
      { words: ['agreement', 'consensus', 'understanding'], weight: -1, reason: 'Agreement indicators' },
      { words: ['peaceful', 'diplomatic', 'constructive'], weight: -1, reason: 'Positive tone' },
      { words: ['progress', 'solution', 'resolution'], weight: -1, reason: 'Solution-oriented' },
      { words: ['appreciate', 'grateful', 'thank'], weight: -1, reason: 'Positive sentiment' }
    ]
    
    // Check all indicators
    const allIndicators = highRiskIndicators.concat(mediumRiskIndicators).concat(positiveIndicators)
    allIndicators.forEach(indicator => {
      const matches = indicator.words.filter(word => text.includes(word))
      if (matches.length > 0) {
        riskScore += indicator.weight * matches.length
        if (indicator.weight > 0) {
          reasons.push(`${indicator.reason} (${matches.join(', ')})`)
        }
      }
    })
    
    // Calculate final risk level
    let level = 'Low'
    if (riskScore >= 6) {
      level = 'High'
    } else if (riskScore >= 3) {
      level = 'Medium'
    }
    
    return { level, reasons: reasons.length > 0 ? reasons : ['Standard diplomatic communication'] }
  }

  const latestCable = useMemo(() => {
    // Check for diplomatic cables first
    const cables = analysisData.filter(item => item.type === 'diplomatic_cable')
    if (cables.length > 0) {
      return cables[cables.length - 1].data
    }
    
    // Collect all transcripts for comprehensive risk analysis
    const allTranscripts: string[] = []
    
    // Check for audio analysis data first (includes translation-based risk assessment)
    const audioAnalysis = analysisData.filter(item => item.type === 'audio_analysis')
    if (audioAnalysis.length > 0) {
      const latest = audioAnalysis[audioAnalysis.length - 1].data
      
      // Collect all transcripts from audio analysis
      audioAnalysis.forEach(item => {
        if (item.data.transcript) {
          allTranscripts.push(item.data.transcript)
        }
        if (item.data.original_transcript && item.data.original_transcript !== item.data.transcript) {
          allTranscripts.push(item.data.original_transcript)
        }
      })
      
      // Analyze transcript content for risk
      const combinedTranscript = allTranscripts.join(' ')
      const transcriptRiskAnalysis = analyzeTranscriptRisk(combinedTranscript)
      
      // Use diplomatic risk level from emotion analysis if available, otherwise use transcript-based risk
      let riskLevel = transcriptRiskAnalysis.level
      let riskReasons = transcriptRiskAnalysis.reasons
      
      if (latest.emotion_analysis && latest.emotion_analysis.diplomatic_risk_level) {
        const emotionRisk = latest.emotion_analysis.diplomatic_risk_level
        const emotionRiskCapitalized = emotionRisk.charAt(0).toUpperCase() + emotionRisk.slice(1)
        
        // Combine emotion-based and transcript-based risk (take the higher one)
        const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 }
        const emotionRiskValue = riskLevels[emotionRiskCapitalized as keyof typeof riskLevels] || 1
        const transcriptRiskValue = riskLevels[transcriptRiskAnalysis.level as keyof typeof riskLevels] || 1
        
        if (emotionRiskValue >= transcriptRiskValue) {
          riskLevel = emotionRiskCapitalized
          riskReasons = ['Emotional analysis indicates elevated risk', ...riskReasons]
        } else {
          riskReasons = ['Transcript content analysis indicates elevated risk', ...riskReasons]
        }
      } else if (latest.emotion_analysis) {
        // Fallback calculation based on emotion and stress scores combined with transcript analysis
        const emotionScore = latest.emotion_analysis.emotion_score || 0
        const stressLevel = latest.emotion_analysis.stress_level || 0
        
        let emotionRisk = 'Low'
        if (stressLevel > 0.7 || emotionScore < -0.5) {
          emotionRisk = 'High'
        } else if (stressLevel > 0.4 || emotionScore < -0.2) {
          emotionRisk = 'Medium'
        }
        
        // Combine emotion-based and transcript-based risk
        const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 }
        const emotionRiskValue = riskLevels[emotionRisk as keyof typeof riskLevels] || 1
        const transcriptRiskValue = riskLevels[transcriptRiskAnalysis.level as keyof typeof riskLevels] || 1
        
        if (emotionRiskValue >= transcriptRiskValue) {
          riskLevel = emotionRisk
          riskReasons = [`Emotional tone analysis (stress: ${(stressLevel * 100).toFixed(0)}%, emotion: ${emotionScore.toFixed(2)})`, ...riskReasons]
        }
      }
      
      const isTranslated = latest.is_translated
      const detectedLanguage = latest.detected_language
      
      // Generate recommendations based on risk level and reasons
      let recommendations: string[] = []
      if (riskLevel === 'High') {
        recommendations = [
          'Immediate diplomatic intervention may be needed',
          'Monitor for escalation signs',
          'Consider cultural mediation',
          'Review recent statements for inflammatory language'
        ]
      } else if (riskLevel === 'Medium') {
        recommendations = [
          'Continue monitoring dialogue tone',
          'Be prepared for tension changes',
          'Maintain diplomatic protocols',
          'Consider clarifying any concerning statements'
        ]
      } else {
        recommendations = [
          'Communication appears constructive',
          'Continue current diplomatic approach',
          'Maintain positive momentum'
        ]
      }
      
      return {
        executive_summary: isTranslated ? 
          `Analysis based on translated speech from ${detectedLanguage} with real-time transcript and emotional assessment` :
          'Analysis based on real-time speech content and emotional tone assessment',
        risk_assessment: {
          risk_level: riskLevel,
          recommendations,
          risk_factors: riskReasons,
          transcript_based: true
        },
        cultural_analysis: {
          cultural_insights: {
            ...latest,
            translation_note: isTranslated ? `Original language detected: ${detectedLanguage}` : null,
            transcript_analysis: `Analyzed ${allTranscripts.length} transcript segments for risk indicators`
          }
        }
      }
    }
    
    // Fallback to facial analysis data
    const facialAnalysis = analysisData.filter(item => item.type === 'facial_analysis')
    if (facialAnalysis.length > 0) {
      const latest = facialAnalysis[facialAnalysis.length - 1].data
      
      // Calculate risk level based on facial emotions
      let riskLevel = 'Low'
      if (latest.emotions && Array.isArray(latest.emotions)) {
        const highStressEmotions = ['angry', 'fear', 'disgust', 'stressed', 'frustrated', 'worried', 'anxious', 'tense']
        const moderateStressEmotions = ['sad', 'confused', 'surprised', 'concerned']
        
        let highStressScore = 0
        let moderateStressScore = 0
        
        latest.emotions.forEach((emo: any) => {
          if (emo.emotion && emo.confidence !== undefined) {
            if (highStressEmotions.includes(emo.emotion.toLowerCase())) {
              highStressScore += emo.confidence
            } else if (moderateStressEmotions.includes(emo.emotion.toLowerCase())) {
              moderateStressScore += emo.confidence
            }
          }
        })
        
        if (highStressScore > 0.6) {
          riskLevel = 'High'
        } else if (highStressScore > 0.3 || moderateStressScore > 0.5) {
          riskLevel = 'Medium'
        }
      }
      
      return {
        executive_summary: 'Analysis based on facial expression detection and behavioral patterns',
        risk_assessment: {
          risk_level: riskLevel,
          recommendations: riskLevel === 'High' ? ['Consider de-escalation strategies', 'Monitor for further stress indicators'] :
                          riskLevel === 'Medium' ? ['Continue monitoring situation', 'Be prepared for tension changes'] :
                          ['Situation appears stable', 'Maintain current approach']
        },
        cultural_analysis: {
          cultural_insights: latest
        }
      }
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

      {/* Sentiment Analysis Timeline */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
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
                  {latestCable.risk_assessment.risk_factors && latestCable.risk_assessment.transcript_based && (
                    <div>
                      <p className="font-medium text-sm text-gray-900">Risk Factors:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {Array.isArray(latestCable.risk_assessment.risk_factors) 
                          ? latestCable.risk_assessment.risk_factors.map((factor: string, idx: number) => (
                              <li key={idx}>{factor}</li>
                            ))
                          : <li>{latestCable.risk_assessment.risk_factors}</li>
                        }
                      </ul>
                    </div>
                  )}
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
                  {latestCable.cultural_analysis.cultural_insights ? (
                    <div>
                      {/* Handle translation note if present */}
                      {latestCable.cultural_analysis.cultural_insights.translation_note && (
                        <p className="mb-2 text-blue-600 font-medium">
                          {latestCable.cultural_analysis.cultural_insights.translation_note}
                        </p>
                      )}
                      
                      {/* Display cultural insights safely */}
                      {typeof latestCable.cultural_analysis.cultural_insights === 'object' ? (
                        <div className="space-y-1">
                          {latestCable.cultural_analysis.cultural_insights.detected_language && (
                            <p><span className="font-medium">Language:</span> {latestCable.cultural_analysis.cultural_insights.detected_language}</p>
                          )}
                          {latestCable.cultural_analysis.cultural_insights.is_translated && (
                            <p><span className="font-medium">Status:</span> Translated from foreign language</p>
                          )}
                          {latestCable.cultural_analysis.cultural_insights.transcript_analysis && (
                            <p><span className="font-medium">Transcript Analysis:</span> {latestCable.cultural_analysis.cultural_insights.transcript_analysis}</p>
                          )}
                          {latestCable.cultural_analysis.cultural_insights.error && (
                            <p className="text-red-600"><span className="font-medium">Note:</span> {latestCable.cultural_analysis.cultural_insights.error}</p>
                          )}
                        </div>
                      ) : (
                        <p>{String(latestCable.cultural_analysis.cultural_insights)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Cultural analysis in progress...</p>
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