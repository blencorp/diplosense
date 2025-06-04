'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR hydration issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false })
const UploadPanel = dynamic(() => import('@/components/UploadPanel'), { ssr: false })
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), { ssr: false })

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
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null)

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
        console.log('WebSocket message received:', analysisUpdate.type, analysisUpdate)
        
        let normalized = analysisUpdate
        if (analysisUpdate.type === "facial_analysis_update") {
          normalized = { ...analysisUpdate, type: "facial_analysis" }
          
          // Update transcript with real analysis data
          if (normalized.data) {
            console.log('Updating transcript with data:', normalized.data)
            // frame_progress is at the top level, not in data
            const frameProgress = (analysisUpdate as any).frame_progress || analysisProgress
            updateTranscript(frameProgress, normalized.data)
          }
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
    // Clear previous transcript when new video is selected
    setCurrentTranscript('')
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

  const handleVideoPlay = () => {
    console.log('Video started playing')
    // Start continuous analysis when video plays
    if (currentVideo && !analysisInterval) {
      startVideoAnalysis()
    }
  }

  const handleVideoPause = () => {
    console.log('Video paused')
    // Stop analysis when video pauses
    stopVideoAnalysis()
  }

  const startVideoAnalysis = () => {
    if (analysisInterval) return // Already running
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    // Clear transcript when starting new analysis
    setCurrentTranscript('')

    let progress = 0
    const interval = setInterval(async () => {
      progress += 0.05 // Update every 500ms with 5% progress
      setAnalysisProgress(progress)
      
      // Transcript will be updated via WebSocket when real analysis data arrives

      // Trigger analysis API call
      try {
        await fetch('/api/v1/analyze/demo-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meeting_id: meetingId,
            video_source: currentVideo,
            frame_progress: progress
          }),
        })
      } catch (error) {
        console.error('Error in continuous analysis:', error)
      }

      // Stop when complete
      if (progress >= 1) {
        stopVideoAnalysis()
      }
    }, 500)
    
    setAnalysisInterval(interval)
  }

  const stopVideoAnalysis = () => {
    if (analysisInterval) {
      clearInterval(analysisInterval)
      setAnalysisInterval(null)
    }
    setIsAnalyzing(false)
  }

  const updateTranscript = (progress: number, analysisData?: any) => {
    console.log('updateTranscript called with:', { progress, analysisData })
    
    // Use actual audio transcript from Whisper if available
    if (analysisData && analysisData.transcript) {
      try {
        const frameTime = analysisData.frame_time || 0
        const timeString = `${Math.floor(frameTime / 60)}:${Math.floor(frameTime % 60).toString().padStart(2, '0')}`
        
        const newSegment = `[${timeString}] ${analysisData.transcript}`
        console.log('Generated transcript segment:', newSegment)
        
        // Append to existing transcript
        setCurrentTranscript(prev => {
          // Avoid duplicate entries
          if (prev.includes(analysisData.transcript)) {
            return prev
          }
          const newTranscript = prev + (prev ? '\n' : '') + newSegment
          console.log('Updated transcript:', newTranscript)
          return newTranscript
        })
      } catch (error) {
        console.error('Error generating transcript segment:', error)
      }
    } else {
      // Only show progress if no actual transcript is available
      console.log('No transcript data available in analysis')
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DiploSense</h1>
              <p className="text-blue-200">Real-Time Diplomatic Intelligence Platform</p>
            </div>
            <nav className="flex gap-4">
              <a 
                href="/" 
                className="px-4 py-2 bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
              >
                Video Analysis
              </a>
              <a 
                href="/live" 
                className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
              >
                Live Camera
              </a>
              <a 
                href="/news" 
                className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
              >
                News Analysis
              </a>
              <a 
                href="/admin/usage" 
                className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors text-sm"
              >
                Admin
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${socketState.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{socketState.isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
              onVideoPlay={handleVideoPlay}
              onVideoPause={handleVideoPause}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity
              analysisData={analysisData}
            />
          </div>
        </div>
      </main>
    </div>
  )
}