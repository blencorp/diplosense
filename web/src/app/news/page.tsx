'use client'

import React, { useState } from 'react'
import { FileText, AlertTriangle, Shield, Target, Loader2 } from 'lucide-react'

interface AnalysisResult {
  diplomatic_overview: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  strategic_recommendations: string[]
  key_entities: string[]
  sentiment_analysis: {
    overall_sentiment: string
    confidence: number
  }
  geopolitical_implications: string[]
  timestamp: string
}

export default function NewsAnalysisPage() {
  const [newsText, setNewsText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!newsText.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    setIsAnalyzing(true)
    setError('')
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/v1/analyze/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newsText,
          analysis_type: 'diplomatic'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setAnalysisResult(result.analysis)
    } catch (err) {
      console.error('Error analyzing news:', err)
      setError('Failed to analyze the text. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <Shield className="w-5 h-5 text-green-600" />
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <Shield className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DiploSense News Analysis</h1>
              <p className="text-blue-200">Diplomatic Intelligence from Text</p>
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
                className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
              >
                Live Camera
              </a>
              <a 
                href="/news" 
                className="px-4 py-2 bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
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
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">News Text Input</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste news article or diplomatic text for analysis
                </label>
                <textarea
                  value={newsText}
                  onChange={(e) => setNewsText(e.target.value)}
                  placeholder="Paste your news article, diplomatic statement, or any text you want to analyze for diplomatic intelligence..."
                  className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newsText.length} characters
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!newsText.trim() || isAnalyzing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Analyze Diplomatic Intelligence</span>
                  </div>
                )}
              </button>

              {error && (
                <div className="flex items-start p-3 bg-red-50 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
            
            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Enter text and click analyze to see diplomatic intelligence results</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Risk Level */}
                <div className={`p-4 rounded-lg border-2 ${getRiskLevelColor(analysisResult.risk_level)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getRiskIcon(analysisResult.risk_level)}
                    <h3 className="font-semibold">Risk Level: {analysisResult.risk_level.toUpperCase()}</h3>
                  </div>
                </div>

                {/* Diplomatic Overview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Diplomatic Overview</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-900 leading-relaxed">{analysisResult.diplomatic_overview}</p>
                  </div>
                </div>

                {/* Strategic Recommendations */}
                {analysisResult.strategic_recommendations && analysisResult.strategic_recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Strategic Recommendations</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {analysisResult.strategic_recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-green-900">
                            <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Key Entities */}
                {analysisResult.key_entities && analysisResult.key_entities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Key Entities</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.key_entities.map((entity, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {analysisResult.sentiment_analysis && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Sentiment Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">
                          Overall Sentiment: {analysisResult.sentiment_analysis.overall_sentiment}
                        </span>
                        <span className="text-gray-600">
                          {(analysisResult.sentiment_analysis.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Geopolitical Implications */}
                {analysisResult.geopolitical_implications && analysisResult.geopolitical_implications.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Geopolitical Implications</h3>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {analysisResult.geopolitical_implications.map((implication, index) => (
                          <li key={index} className="flex items-start gap-2 text-orange-900">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{implication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  Analysis completed: {new Date(analysisResult.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}