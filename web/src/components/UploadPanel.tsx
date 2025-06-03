'use client'

import React, { useState, ChangeEvent } from 'react'
import { Upload, Video, FileText } from 'lucide-react'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface UploadPanelProps {
  meetingId: string
  onAnalysisComplete: (analysis: AnalysisData) => void
  onVideoSelected?: (videoUrl: string) => void
  onAnalysisStart?: () => void
  onAnalysisProgress?: (progress: number) => void
  currentTranscript?: string
}

const UploadPanel: React.FC<UploadPanelProps> = ({
  meetingId,
  onAnalysisComplete,
  onVideoSelected,
  onAnalysisStart,
  onAnalysisProgress,
  currentTranscript = ''
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<string>('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const API_BASE = '/api/v1'

  // Demo video options
  const demoVideos = [
    { id: 'nebenzya', name: 'Vasily Nebenzya UN Speech', url: '/demo-data/video/ambassador-vasily-nebenzya.mp4' },
    { id: 'putin', name: 'Putin UN Speech', url: '/demo-data/video/putin.mp4' }
  ]

  const handleDemoVideoSelect = (videoUrl: string) => {
    setSelectedDemoVideo(videoUrl)
    onVideoSelected?.(videoUrl)
    // Reset any previous analysis state
    setLoading((prev: Record<string, boolean>) => ({ ...prev, demoVideo: false }))
  }

  const handleDemoVideoAnalysis = async () => {
    if (!selectedDemoVideo) return

    setLoading((prev: Record<string, boolean>) => ({ ...prev, demoVideo: true }))
    onAnalysisStart?.()

    try {
      // Simulate progressive analysis for demo
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 0.1
        onAnalysisProgress?.(progress)

        if (progress >= 1) {
          clearInterval(progressInterval)
        }
      }, 500)

      // Simulate multiple analysis updates over time
      const simulateAnalysis = async () => {
        const totalUpdates = 5
        for (let i = 0; i < totalUpdates; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Trigger demo video analysis that will broadcast via WebSocket
          await fetch(`${API_BASE}/analyze/demo-video`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meeting_id: meetingId,
              video_source: selectedDemoVideo,
              frame_progress: (i + 1) / totalUpdates
            }),
          })
        }
      }

      await simulateAnalysis()

    } catch (error) {
      console.error('Error analyzing demo video:', error)
      alert('Error analyzing demo video. Please try again.')
    } finally {
      setLoading((prev: Record<string, boolean>) => ({ ...prev, demoVideo: false }))
    }
  }

  const handleVideoUpload = async (file: File) => {
    setLoading((prev: Record<string, boolean>) => ({ ...prev, video: true }))

    try {
      const formData = new FormData()
      formData.append('video_file', file)
      formData.append('meeting_id', meetingId)

      const response = await fetch(`${API_BASE}/analyze/video`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      onAnalysisComplete({
        type: 'video_analysis',
        meeting_id: meetingId,
        data: result.analysis,
        timestamp: new Date().toISOString()
      })

      setVideoFile(null)

    } catch (error) {
      console.error('Error uploading video:', error)
      if (error instanceof Error && error.name === 'TimeoutError') {
        alert('Video analysis is taking longer than expected, but real-time updates will continue to appear in the dashboard.')
      } else {
        alert('Error uploading video. Please try again.')
      }
    } finally {
      setLoading((prev: Record<string, boolean>) => ({ ...prev, video: false }))
    }
  }




  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else if (file) {
      alert('Please upload a video file');
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload & Analysis</h2>

        {/* Video Analysis */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Video className="inline w-4 h-4 mr-1" />
            Video Analysis
          </label>

          {/* Demo Video Selection */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-2">Select Demo Video</label>
            <select
              value={selectedDemoVideo}
              onChange={(e) => handleDemoVideoSelect(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Choose a demo video...</option>
              {demoVideos.map((video) => (
                <option key={video.id} value={video.url}>
                  {video.name}
                </option>
              ))}
            </select>
            {selectedDemoVideo && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm text-blue-700">
                <p>✓ Video selected. Play the video on the right to start real-time analysis.</p>
              </div>
            )}
          </div>

          {/* File Upload Option */}
          <div className="border-t pt-4">
            <label className="block text-xs text-gray-600 mb-2">Or Upload Your Own Video</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <button
                onClick={() => videoFile && handleVideoUpload(videoFile)}
                disabled={!videoFile || loading.video}
                className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700"
              >
                {loading.video ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

        </div>


        {/* Live Transcript */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Live Transcript
          </h3>
          <div className="bg-gray-50 p-3 rounded-md min-h-[120px] max-h-[300px] overflow-y-auto">
            {currentTranscript ? (
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentTranscript}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Transcript will appear here when video analysis begins...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Info */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Meeting Information</h3>
        <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
        <p className="text-xs text-gray-500 mt-1">
          Started: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default UploadPanel