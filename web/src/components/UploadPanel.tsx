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
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Upload & Analysis</h2>

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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base transition-all duration-200 bg-white hover:border-gray-400"
            >
              <option value="">Choose a demo video...</option>
              {demoVideos.map((video) => (
                <option key={video.id} value={video.url}>
                  {video.name}
                </option>
              ))}
            </select>
            {selectedDemoVideo && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="font-medium">Video selected. Play the video on the right to start real-time analysis.</p>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Option */}
          <div className="border-t pt-4">
            <label className="block text-xs text-gray-600 mb-2">Or Upload Your Own Video</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 md:file:px-4 file:rounded-full file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 file:transition-colors file:cursor-pointer cursor-pointer"
              />
              <button
                onClick={() => videoFile && handleVideoUpload(videoFile)}
                disabled={!videoFile || loading.video}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm md:text-base"
              >
                {loading.video ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze Video'
                )}
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

    </div>
  )
}

export default UploadPanel