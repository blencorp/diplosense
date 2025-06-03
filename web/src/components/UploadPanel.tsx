'use client'

import React, { useState, ChangeEvent } from 'react'
import { Upload, Video, FileText, Send } from 'lucide-react'

interface AnalysisData {
  type: string
  meeting_id: string
  data: any
  timestamp: string
}

interface UploadPanelProps {
  meetingId: string
  onAnalysisComplete: (analysis: AnalysisData) => void
}

const UploadPanel: React.FC<UploadPanelProps> = ({ meetingId, onAnalysisComplete }: UploadPanelProps) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [cultures, setCultures] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const API_BASE = '/api/v1'

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

  const handleDemoAnalysis = async () => {
    setLoading((prev: Record<string, boolean>) => ({ ...prev, demo: true }))

    try {
      const response = await fetch(`${API_BASE}/demo/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_id: meetingId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      onAnalysisComplete({
        type: 'demo_analysis',
        meeting_id: meetingId,
        data: result.analysis,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error running demo:', error)
      alert('Error running demo. Please try again.')
    } finally {
      setLoading((prev: Record<string, boolean>) => ({ ...prev, demo: false }))
    }
  }

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) return

    setLoading((prev: Record<string, boolean>) => ({ ...prev, text: true }))

    try {
      const formData = new FormData()
      formData.append('text', textInput)
      formData.append('meeting_id', meetingId)
      formData.append('cultures', JSON.stringify(cultures.split(',').map((c: string) => c.trim()).filter((c: string) => c)))

      const response = await fetch(`${API_BASE}/analyze/text`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      onAnalysisComplete({
        type: 'text_analysis',
        meeting_id: meetingId,
        data: result.analysis,
        timestamp: new Date().toISOString()
      })

      setTextInput('')

    } catch (error) {
      console.error('Error analyzing text:', error)
      alert('Error analyzing text. Please try again.')
    } finally {
      setLoading((prev: Record<string, boolean>) => ({ ...prev, text: false }))
    }
  }

  const generateCable = async () => {
    setLoading((prev: Record<string, boolean>) => ({ ...prev, cable: true }))

    try {
      // This would normally collect all the analysis data
      const analysisData = {
        meeting_id: meetingId,
        timestamp: new Date().toISOString()
      }

      const formData = new FormData()
      formData.append('meeting_id', meetingId)
      formData.append('analysis_data', JSON.stringify(analysisData))

      const response = await fetch(`${API_BASE}/generate/cable`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      onAnalysisComplete({
        type: 'diplomatic_cable',
        meeting_id: meetingId,
        data: result.cable,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error generating cable:', error)
      alert('Error generating diplomatic cable. Please try again.')
    } finally {
      setLoading((prev: Record<string, boolean>) => ({ ...prev, cable: false }))
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

        {/* Video Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Video className="inline w-4 h-4 mr-1" />
            Video Analysis
          </label>
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
          <div className="mt-2">
            <button
              onClick={handleDemoAnalysis}
              disabled={loading.demo}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              {loading.demo ? 'Running Demo...' : 'Quick Demo'}
            </button>
            <span className="ml-2 text-xs text-gray-500">
              Analyze sample diplomatic meeting video
            </span>
          </div>
        </div>

        {/* Text Analysis */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Text Sentiment Analysis
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter transcript or meeting notes for analysis..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
          <input
            type="text"
            value={cultures}
            onChange={(e) => setCultures(e.target.value)}
            placeholder="Cultural backgrounds (comma-separated, e.g., American, Japanese, German)"
            className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleTextAnalysis}
            disabled={!textInput.trim() || loading.text}
            className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-purple-700"
          >
            {loading.text ? 'Analyzing...' : 'Analyze Text'}
          </button>
        </div>

        {/* Generate Cable */}
        <div className="border-t pt-4">
          <button
            onClick={generateCable}
            disabled={loading.cable}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-700 flex items-center justify-center"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading.cable ? 'Generating...' : 'Generate Diplomatic Cable'}
          </button>
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