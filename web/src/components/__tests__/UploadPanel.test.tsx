import { render, screen, fireEvent, waitFor } from '@/test-utils/testUtils'
import userEvent from '@testing-library/user-event'
import UploadPanel from '../UploadPanel'

// Mock fetch
global.fetch = jest.fn()

describe('UploadPanel Component', () => {
  const mockOnAnalysisComplete = jest.fn()
  const defaultProps = {
    meetingId: 'test-meeting-1',
    onAnalysisComplete: mockOnAnalysisComplete
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    test('renders all main sections', () => {
      render(<UploadPanel {...defaultProps} />)
      
      expect(screen.getByText('Upload & Analysis')).toBeInTheDocument()
      expect(screen.getByText('Video Analysis')).toBeInTheDocument()
      expect(screen.getByText('Text Sentiment Analysis')).toBeInTheDocument()
      expect(screen.getByText('Generate Diplomatic Cable')).toBeInTheDocument()
    })

    test('renders file input for video upload', () => {
      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = screen.getByRole('textbox', { hidden: true }) || 
                       screen.getByDisplayValue('') ||
                       document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })

    test('renders text input areas', () => {
      render(<UploadPanel {...defaultProps} />)
      
      expect(screen.getByPlaceholderText(/Enter transcript or meeting notes/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Cultural backgrounds/)).toBeInTheDocument()
    })

    test('renders action buttons', () => {
      render(<UploadPanel {...defaultProps} />)
      
      expect(screen.getByText('Analyze')).toBeInTheDocument()
      expect(screen.getByText('Quick Demo')).toBeInTheDocument()
      expect(screen.getByText('Analyze Text')).toBeInTheDocument()
      expect(screen.getByText('Generate Diplomatic Cable')).toBeInTheDocument()
    })

    test('shows meeting information', () => {
      render(<UploadPanel {...defaultProps} />)
      
      expect(screen.getByText('Meeting Information')).toBeInTheDocument()
      expect(screen.getByText('Meeting ID: test-meeting-1')).toBeInTheDocument()
    })
  })

  describe('Demo Analysis', () => {
    test('triggers demo analysis when Quick Demo button is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          analysis: { test: 'data' }
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const demoButton = screen.getByText('Quick Demo')
      fireEvent.click(demoButton)
      
      expect(screen.getByText('Running Demo...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/v1/demo/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meeting_id: 'test-meeting-1' })
        })
      })
      
      await waitFor(() => {
        expect(mockOnAnalysisComplete).toHaveBeenCalledWith({
          type: 'demo_analysis',
          meeting_id: 'test-meeting-1',
          data: { test: 'data' },
          timestamp: expect.any(String)
        })
      })
      
      expect(screen.getByText('Quick Demo')).toBeInTheDocument()
    })

    test('handles demo analysis error', async () => {
      const mockResponse = { ok: false, status: 500 }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      
      render(<UploadPanel {...defaultProps} />)
      
      const demoButton = screen.getByText('Quick Demo')
      fireEvent.click(demoButton)
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error running demo. Please try again.')
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('Text Analysis', () => {
    test('enables text analysis button when text is entered', async () => {
      const user = userEvent.setup()
      render(<UploadPanel {...defaultProps} />)
      
      const textArea = screen.getByPlaceholderText(/Enter transcript or meeting notes/)
      const analyzeButton = screen.getByText('Analyze Text')
      
      expect(analyzeButton).toBeDisabled()
      
      await user.type(textArea, 'This is a test transcript')
      
      expect(analyzeButton).toBeEnabled()
    })

    test('triggers text analysis with correct data', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          analysis: { sentiment: 'positive' }
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const textArea = screen.getByPlaceholderText(/Enter transcript or meeting notes/)
      const culturesInput = screen.getByPlaceholderText(/Cultural backgrounds/)
      const analyzeButton = screen.getByText('Analyze Text')
      
      await user.type(textArea, 'Test transcript content')
      await user.type(culturesInput, 'American, Chinese')
      
      fireEvent.click(analyzeButton)
      
      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/v1/analyze/text', {
          method: 'POST',
          body: expect.any(FormData)
        })
      })
      
      await waitFor(() => {
        expect(mockOnAnalysisComplete).toHaveBeenCalledWith({
          type: 'text_analysis',
          meeting_id: 'test-meeting-1',
          data: { sentiment: 'positive' },
          timestamp: expect.any(String)
        })
      })
    })

    test('clears text input after successful analysis', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          analysis: { sentiment: 'positive' }
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const textArea = screen.getByPlaceholderText(/Enter transcript or meeting notes/)
      const analyzeButton = screen.getByText('Analyze Text')
      
      await user.type(textArea, 'Test content')
      fireEvent.click(analyzeButton)
      
      await waitFor(() => {
        expect((textArea as HTMLTextAreaElement).value).toBe('')
      })
    })
  })

  describe('Video Upload', () => {
    test('accepts video file and enables analyze button', async () => {
      const user = userEvent.setup()
      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const analyzeButton = screen.getByText('Analyze')
      
      expect(analyzeButton).toBeDisabled()
      
      const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      await user.upload(fileInput, videoFile)
      
      expect(analyzeButton).toBeEnabled()
    })

    test('rejects non-video files', async () => {
      const user = userEvent.setup()
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      
      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' })
      await user.upload(fileInput, textFile)
      
      expect(alertSpy).toHaveBeenCalledWith('Please upload a video file')
      alertSpy.mockRestore()
    })

    test('triggers video analysis with proper timeout handling', async () => {
      const user = userEvent.setup()
      
      // Mock AbortSignal.timeout
      const mockAbortSignal = { aborted: false }
      global.AbortSignal = {
        timeout: jest.fn(() => mockAbortSignal)
      } as any
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          analysis: [{ frame: 1, analysis: { emotions: [] } }]
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const analyzeButton = screen.getByText('Analyze')
      
      const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      await user.upload(fileInput, videoFile)
      
      fireEvent.click(analyzeButton)
      
      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/v1/analyze/video', {
          method: 'POST',
          body: expect.any(FormData),
          signal: mockAbortSignal
        })
      })
      
      expect(global.AbortSignal.timeout).toHaveBeenCalledWith(120000)
    })

    test('handles video analysis timeout', async () => {
      const user = userEvent.setup()
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      
      const timeoutError = new Error('Timeout')
      timeoutError.name = 'TimeoutError'
      ;(fetch as jest.Mock).mockRejectedValueOnce(timeoutError)

      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const analyzeButton = screen.getByText('Analyze')
      
      const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      await user.upload(fileInput, videoFile)
      
      fireEvent.click(analyzeButton)
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Video analysis is taking longer than expected, but real-time updates will continue to appear in the dashboard.'
        )
      })
      
      alertSpy.mockRestore()
    })

    test('clears video file after successful upload', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          analysis: []
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const analyzeButton = screen.getByText('Analyze')
      
      const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
      await user.upload(fileInput, videoFile)
      
      expect(analyzeButton).toBeEnabled()
      
      fireEvent.click(analyzeButton)
      
      await waitFor(() => {
        expect(analyzeButton).toBeDisabled()
      })
    })
  })

  describe('Diplomatic Cable Generation', () => {
    test('triggers cable generation', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          meeting_id: 'test-meeting-1',
          cable: { executive_summary: 'Test summary' }
        })
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<UploadPanel {...defaultProps} />)
      
      const cableButton = screen.getByText('Generate Diplomatic Cable')
      fireEvent.click(cableButton)
      
      expect(screen.getByText('Generating...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/v1/generate/cable', {
          method: 'POST',
          body: expect.any(FormData)
        })
      })
      
      await waitFor(() => {
        expect(mockOnAnalysisComplete).toHaveBeenCalledWith({
          type: 'diplomatic_cable',
          meeting_id: 'test-meeting-1',
          data: { executive_summary: 'Test summary' },
          timestamp: expect.any(String)
        })
      })
    })
  })

  describe('Loading States', () => {
    test('shows loading states for all operations', async () => {
      render(<UploadPanel {...defaultProps} />)
      
      // Mock pending promises to keep loading states visible
      ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      
      // Test demo loading
      fireEvent.click(screen.getByText('Quick Demo'))
      expect(screen.getByText('Running Demo...')).toBeInTheDocument()
      
      // Reset and test cable loading
      ;(fetch as jest.Mock).mockClear()
      fireEvent.click(screen.getByText('Generate Diplomatic Cable'))
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })

    test('disables buttons during loading', async () => {
      render(<UploadPanel {...defaultProps} />)
      
      ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
      
      const demoButton = screen.getByText('Quick Demo')
      fireEvent.click(demoButton)
      
      expect(screen.getByText('Running Demo...')).toBeDisabled()
    })
  })
})