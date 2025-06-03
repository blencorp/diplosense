'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Camera, Square, Play, Pause, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR issues
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false })

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

export default function LiveAnalysisPage() {
  const [mounted, setMounted] = useState(false)
  const [socketState, setSocketState] = useState<SocketState>({
    socket: null,
    isConnected: false
  })
  const [meetingId, setMeetingId] = useState<string>('live-meeting-1')
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisProgress, setAnalysisProgress] = useState<number>(0)
  const [currentTranscript, setCurrentTranscript] = useState<string>('')
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Camera related state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle video stream assignment
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Assigning stream to video element')
      videoRef.current.srcObject = stream
      
      const video = videoRef.current
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, attempting to play')
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight)
        video.play().catch(error => {
          console.error('Failed to play video:', error)
        })
      }
      
      video.onplaying = () => {
        console.log('Video is now playing')
      }
    }
  }, [stream])

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
          if (normalized.data && normalized.data.transcript) {
            const frameTime = normalized.data.frame_time || 0
            const timeString = new Date().toLocaleTimeString()
            const newSegment = `[${timeString}] ${normalized.data.transcript}`
            
            setCurrentTranscript(prev => {
              if (prev.includes(normalized.data.transcript)) {
                return prev
              }
              return prev + (prev ? '\n' : '') + newSegment
            })
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

  const initCamera = async () => {
    try {
      setError('')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      })
      
      setStream(mediaStream)
      setHasPermission(true)
      console.log('Camera stream initialized successfully')
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Failed to access camera. Please ensure you have granted camera permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setHasPermission(false)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    stopAnalysis()
  }

  const startAnalysis = () => {
    if (!stream || isAnalyzing) return
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentTranscript('')

    let progress = 0
    const interval = setInterval(async () => {
      progress += 0.1 // Update every 1000ms with 10% progress
      setAnalysisProgress(Math.min(progress, 1))
      
      // Capture frame and send for analysis
      await captureAndAnalyzeFrame()
      
      if (progress >= 1) {
        progress = 0 // Reset for continuous analysis
      }
    }, 1000)
    
    setAnalysisInterval(interval)
  }

  const stopAnalysis = () => {
    if (analysisInterval) {
      clearInterval(analysisInterval)
      setAnalysisInterval(null)
    }
    setIsAnalyzing(false)
    setAnalysisProgress(0)
  }

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      try {
        // Convert blob to base64 for API
        const arrayBuffer = await blob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Send frame for analysis
        const response = await fetch('/api/v1/analyze/live-camera', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meeting_id: meetingId,
            image_data: Array.from(uint8Array),
            timestamp: new Date().toISOString()
          }),
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Live analysis result:', result)
        }
      } catch (error) {
        console.error('Error analyzing frame:', error)
      }
    }, 'image/jpeg', 0.8)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopAnalysis()
      setIsRecording(false)
    } else {
      startAnalysis()
      setIsRecording(true)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DiploSense Live...</p>
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
              <h1 className="text-2xl font-bold">DiploSense Live</h1>
              <p className="text-blue-200">Real-Time Camera Analysis</p>
            </div>
            <nav className="flex gap-4">
              <a 
                href="/" 
                className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
              >
                Video Analysis
              </a>
              <a 
                href="/live" 
                className="px-4 py-2 bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
              >
                Live Camera
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Camera Controls</h2>
              
              {/* Camera Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Camera Status:</span>
                <span className={`text-sm px-2 py-1 rounded ${hasPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {hasPermission ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Camera Controls */}
              {!hasPermission ? (
                <button
                  onClick={initCamera}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={toggleRecording}
                    disabled={!hasPermission}
                    className={`w-full px-4 py-3 text-white rounded-md flex items-center justify-center ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Analysis
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Analysis
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={stopCamera}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Stop Camera
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start p-3 bg-red-50 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Analyzing</span>
                    <span className="text-sm text-blue-700">{Math.round(analysisProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Live Transcript */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Live Transcript</h3>
                <div className="bg-gray-50 p-3 rounded-md min-h-[120px] max-h-[300px] overflow-y-auto">
                  {currentTranscript ? (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {currentTranscript}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Real-time speech transcript will appear here...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Camera Feed and Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                {hasPermission ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-96 object-cover bg-black"
                      onLoadedData={() => console.log('Video loaded')}
                      onError={(e) => console.error('Video error:', e)}
                      onCanPlay={() => console.log('Video can play')}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    {isRecording && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        ● LIVE
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-96 bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">Camera not connected</p>
                      <p className="text-sm">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard */}
            <Dashboard
              analysisData={analysisData}
              meetingId={meetingId}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
            />
          </div>
        </div>
      </main>
    </div>
  )
}