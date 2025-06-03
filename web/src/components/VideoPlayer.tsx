'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl?: string
  isAnalyzing?: boolean
  analysisProgress?: number
  onTimeUpdate?: (currentTime: number) => void
  onLoadedData?: (duration: number) => void
  onPlay?: () => void
  onPause?: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isAnalyzing = false,
  analysisProgress = 0,
  onTimeUpdate,
  onLoadedData,
  onPlay,
  onPause
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
    }

    const handleLoadedData = () => {
      setDuration(video.duration)
      onLoadedData?.(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate, onLoadedData])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const seekTime = (parseFloat(e.target.value) / 100) * duration
    video.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value) / 100
    video.volume = newVolume
    setVolume(newVolume)
  }

  const resetVideo = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
    if (isPlaying) {
      video.pause()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const analysisPercentage = Math.min(analysisProgress * 100, 100)

  if (!videoUrl) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-96">
        <p className="text-gray-500">No video selected</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-96 object-contain bg-black"
          preload="metadata"
        />
        
        {/* Analysis overlay */}
        {isAnalyzing && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Analyzing...
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlay}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-gray-800" />
            ) : (
              <Play className="w-8 h-8 text-gray-800 ml-1" />
            )}
          </button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Progress bars */}
        <div className="space-y-2">
          {/* Video progress */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="text-xs text-gray-500 flex justify-between mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Analysis progress */}
          {isAnalyzing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Analysis Progress</span>
                <span>{analysisPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={resetVideo}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default VideoPlayer