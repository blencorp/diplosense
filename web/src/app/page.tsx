'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR hydration issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false })
const UploadPanel = dynamic(() => import('@/components/UploadPanel'), { ssr: false })

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [socketState, setSocketState] = useState<SocketState>({
    socket: null,
    isConnected: false
  })
  const [meetingId, setMeetingId] = useState<string>('demo-meeting-1')
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [currentVideo, setCurrentVideo] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisProgress, setAnalysisProgress] = useState<number>(0)
  const [currentTranscript, setCurrentTranscript] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only run on client side after mounting
    if (!mounted) return

    // Initialize WebSocket connection
    const wsUrl = window.location.hostname === 'localhost'
      ? 'ws://localhost:8080/api/v1/ws'
      : `ws://${window.location.host}/api/v1/ws`

    const socket = new WebSocket(`${wsUrl}/${meetingId}`)

    socket.onopen = () => {
      setSocketState((prev: SocketState) => ({ ...prev, isConnected: true }))
      console.log('Connected to WebSocket')
    }

    socket.onclose = () => {
      setSocketState((prev: SocketState) => ({ ...prev, isConnected: false }))
      console.log('Disconnected from WebSocket')
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const analysisUpdate: AnalysisData = JSON.parse(event.data)
        let normalized = analysisUpdate
        if (analysisUpdate.type === "facial_analysis_update") {
          normalized = { ...analysisUpdate, type: "facial_analysis" }
        }
        setAnalysisData((prev: AnalysisData[]) => [...prev, normalized])
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error)
      setSocketState((prev: SocketState) => ({ ...prev, isConnected: false }))
    }

    setSocketState((prev: SocketState) => ({ ...prev, socket }))

    return () => {
      socket.close()
    }
  }, [meetingId, mounted])

  const handleNewAnalysis = (analysis: AnalysisData) => {
    setAnalysisData((prev: AnalysisData[]) => [...prev, analysis])
  }

  const handleVideoSelected = (videoUrl: string) => {
    setCurrentVideo(videoUrl)
  }

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
  }

  const handleAnalysisProgress = (progress: number) => {
    setAnalysisProgress(progress)
    if (progress >= 1) {
      setIsAnalyzing(false)
    }
    
    // Update transcript based on progress
    updateTranscript(progress)
  }

  const updateTranscript = (progress: number) => {
    const transcriptSegments = [
      "Ladies and gentlemen, distinguished delegates...",
      "We gather here today to address matters of utmost importance to our nations...",
      "The current geopolitical situation requires careful consideration and diplomatic dialogue...",
      "I believe we can find common ground through respectful negotiation...",
      "Our countries share many interests and values that can serve as a foundation...",
      "Thank you for your attention and I look forward to productive discussions."
    ]
    
    const segmentIndex = Math.floor(progress * transcriptSegments.length)
    const transcript = transcriptSegments.slice(0, segmentIndex + 1).join(' ')
    setCurrentTranscript(transcript)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DiploSense...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">DiploSense</h1>
          <p className="text-blue-200">Real-Time Diplomatic Intelligence Fusion Platform</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${socketState.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{socketState.isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadPanel
              meetingId={meetingId}
              onAnalysisComplete={handleNewAnalysis}
              onVideoSelected={handleVideoSelected}
              onAnalysisStart={handleAnalysisStart}
              onAnalysisProgress={handleAnalysisProgress}
              currentTranscript={currentTranscript}
            />
          </div>
          <div className="lg:col-span-2">
            <Dashboard
              analysisData={analysisData}
              meetingId={meetingId}
              currentVideo={currentVideo}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
            />
          </div>
        </div>
      </main>
    </div>
  )
}