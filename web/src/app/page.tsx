'use client'

import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import Dashboard from '@/components/Dashboard'
import UploadPanel from '@/components/UploadPanel'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [meetingId, setMeetingId] = useState<string>('demo-meeting-1')
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize WebSocket connection
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'ws://api:8000' 
      : 'ws://localhost:8000'
    const newSocket = io(wsUrl, {
      transports: ['websocket']
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to WebSocket')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from WebSocket')
    })

    newSocket.on('message', (data: string) => {
      try {
        const analysisUpdate: AnalysisData = JSON.parse(data)
        setAnalysisData(prev => [...prev, analysisUpdate])
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const handleNewAnalysis = (analysis: AnalysisData) => {
    setAnalysisData(prev => [...prev, analysis])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">DiploSense</h1>
          <p className="text-blue-200">Real-Time Diplomatic Intelligence Fusion Platform</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadPanel 
              meetingId={meetingId}
              onAnalysisComplete={handleNewAnalysis}
            />
          </div>
          <div className="lg:col-span-2">
            <Dashboard 
              analysisData={analysisData}
              meetingId={meetingId}
            />
          </div>
        </div>
      </main>
    </div>
  )
}