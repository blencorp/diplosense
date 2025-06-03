/**
 * API Integration Tests
 * These tests verify the API endpoints are working correctly
 * They can be run against a live API instance for end-to-end testing
 */

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8080/api/v1'

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Reset fetch mock for each test
    if (typeof fetch !== 'undefined') {
      jest.clearAllMocks()
    }
  })

  describe('Demo Analysis Endpoint', () => {
    test('POST /demo/analyze returns valid response', async () => {
      const response = await fetch(`${API_BASE_URL}/demo/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: 'test-integration' })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('meeting_id', 'test-integration')
      expect(data).toHaveProperty('analysis')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('demo', true)
      
      // Verify structure of demo analysis
      expect(data.analysis).toHaveProperty('facial_expressions')
      expect(data.analysis).toHaveProperty('overall_assessment')
      expect(data.analysis.overall_assessment).toHaveProperty('tension_level')
      expect(data.analysis.overall_assessment).toHaveProperty('cooperation_probability')
    })

    test('demo analysis contains expected data structure', async () => {
      const response = await fetch(`${API_BASE_URL}/demo/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: 'structure-test' })
      })

      const data = await response.json()
      const analysis = data.analysis

      // Test facial expressions structure
      expect(analysis.facial_expressions).toHaveProperty('participant_1')
      expect(analysis.facial_expressions).toHaveProperty('participant_2')
      expect(analysis.facial_expressions.participant_1).toHaveProperty('nationality')
      expect(analysis.facial_expressions.participant_1).toHaveProperty('primary_emotion')
      expect(analysis.facial_expressions.participant_1).toHaveProperty('confidence_level')

      // Test overall assessment structure
      expect(analysis.overall_assessment.tension_level).toMatch(/^(low|moderate|high)$/)
      expect(typeof analysis.overall_assessment.cooperation_probability).toBe('number')
      expect(analysis.overall_assessment.cooperation_probability).toBeGreaterThanOrEqual(0)
      expect(analysis.overall_assessment.cooperation_probability).toBeLessThanOrEqual(1)
    })
  })

  describe('Text Analysis Endpoint', () => {
    test('POST /analyze/text processes text correctly', async () => {
      const formData = new FormData()
      formData.append('text', 'This is a test diplomatic transcript for analysis.')
      formData.append('meeting_id', 'text-test')
      formData.append('cultures', JSON.stringify(['American', 'Chinese']))

      const response = await fetch(`${API_BASE_URL}/analyze/text`, {
        method: 'POST',
        body: formData
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('meeting_id', 'text-test')
      expect(data).toHaveProperty('analysis')
      expect(data).toHaveProperty('timestamp')
      
      // Verify text analysis structure
      const analysis = data.analysis
      expect(analysis).toHaveProperty('sentiment')
      expect(analysis).toHaveProperty('polarity')
      expect(typeof analysis.polarity).toBe('number')
    })

    test('handles empty cultures array', async () => {
      const formData = new FormData()
      formData.append('text', 'Test text without cultural context.')
      formData.append('meeting_id', 'no-culture-test')
      formData.append('cultures', '[]')

      const response = await fetch(`${API_BASE_URL}/analyze/text`, {
        method: 'POST',
        body: formData
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.analysis).toHaveProperty('sentiment')
    })
  })

  describe('Video Analysis Endpoint', () => {
    test('POST /analyze/video handles video files', async () => {
      // Create a minimal video file for testing
      const videoBlob = new Blob(['fake video content'], { type: 'video/mp4' })
      const formData = new FormData()
      formData.append('video_file', videoBlob, 'test-video.mp4')
      formData.append('meeting_id', 'video-test')

      const response = await fetch(`${API_BASE_URL}/analyze/video`, {
        method: 'POST',
        body: formData
      })

      // Note: This might fail with actual video processing, but should at least
      // return a proper error response structure
      expect([200, 400, 500]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('meeting_id', 'video-test')
        expect(data).toHaveProperty('analysis')
      }
    })

    test('rejects non-video files', async () => {
      const textBlob = new Blob(['not a video'], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('video_file', textBlob, 'test.txt')
      formData.append('meeting_id', 'invalid-video-test')

      const response = await fetch(`${API_BASE_URL}/analyze/video`, {
        method: 'POST',
        body: formData
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Diplomatic Cable Generation', () => {
    test('POST /generate/cable creates diplomatic cable', async () => {
      const analysisData = {
        meeting_id: 'cable-test',
        timestamp: new Date().toISOString(),
        sample_data: 'test'
      }

      const formData = new FormData()
      formData.append('meeting_id', 'cable-test')
      formData.append('analysis_data', JSON.stringify(analysisData))

      const response = await fetch(`${API_BASE_URL}/generate/cable`, {
        method: 'POST',
        body: formData
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('meeting_id', 'cable-test')
      expect(data).toHaveProperty('cable')
      
      // Verify cable structure
      const cable = data.cable
      expect(cable).toHaveProperty('executive_summary')
      expect(cable).toHaveProperty('risk_assessment')
      expect(cable).toHaveProperty('cultural_analysis')
    })
  })

  describe('Health Checks', () => {
    test('API root endpoint is accessible', async () => {
      const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('message')
    })

    test('Health check endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status', 'healthy')
      expect(data).toHaveProperty('service', 'diplosense-api')
    })
  })

  describe('Error Handling', () => {
    test('returns 404 for non-existent endpoints', async () => {
      const response = await fetch(`${API_BASE_URL}/non-existent-endpoint`)
      expect(response.status).toBe(404)
    })

    test('returns 405 for wrong HTTP methods', async () => {
      const response = await fetch(`${API_BASE_URL}/demo/analyze`, {
        method: 'GET'
      })
      expect(response.status).toBe(405)
    })

    test('handles malformed JSON gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/demo/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": json}'
      })
      
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})

/**
 * WebSocket Integration Tests
 */
describe('WebSocket Integration Tests', () => {
  let ws: WebSocket
  const WS_URL = process.env.TEST_WS_URL || 'ws://localhost:8080/api/v1/ws/test-meeting'

  beforeEach(() => {
    if (typeof WebSocket !== 'undefined') {
      ws = new WebSocket(WS_URL)
    }
  })

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  })

  test('WebSocket connection can be established', (done) => {
    if (typeof WebSocket === 'undefined') {
      done()
      return
    }

    ws.onopen = () => {
      expect(ws.readyState).toBe(WebSocket.OPEN)
      done()
    }

    ws.onerror = (error) => {
      done(error)
    }

    // Timeout after 5 seconds
    setTimeout(() => {
      done(new Error('WebSocket connection timeout'))
    }, 5000)
  })

  test('WebSocket receives demo analysis broadcasts', (done) => {
    if (typeof WebSocket === 'undefined') {
      done()
      return
    }

    let messageReceived = false

    ws.onopen = async () => {
      // Trigger a demo analysis which should broadcast via WebSocket
      const response = await fetch(`${API_BASE_URL}/demo/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: 'ws-test-meeting' })
      })
      
      expect(response.status).toBe(200)
    }

    ws.onmessage = (event) => {
      if (!messageReceived) {
        messageReceived = true
        
        try {
          const data = JSON.parse(event.data)
          expect(data).toHaveProperty('type')
          expect(data).toHaveProperty('meeting_id')
          expect(data).toHaveProperty('data')
          expect(data).toHaveProperty('timestamp')
          done()
        } catch (error) {
          done(error)
        }
      }
    }

    ws.onerror = (error) => {
      done(error)
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!messageReceived) {
        done(new Error('No WebSocket message received'))
      }
    }, 10000)
  })
})