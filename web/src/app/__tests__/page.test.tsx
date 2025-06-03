import { render, screen, waitFor, act } from '@/test-utils/testUtils'
import HomePage from '../page'
import { 
  waitForWebSocketMessage, 
  triggerWebSocketOpen, 
  triggerWebSocketClose 
} from '@/test-utils/testUtils'
import { mockDemoAnalysisData, mockFacialAnalysisData } from '@/test-utils/mockData'

// Mock the dynamic imports
jest.mock('next/dynamic', () => (fn: any) => {
  const dynamicModule = fn()
  return dynamicModule.default || dynamicModule
})

describe('Home Page', () => {
  let mockWebSocket: any

  beforeEach(() => {
    // Reset WebSocket mock
    mockWebSocket = {
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      send: jest.fn(),
      close: jest.fn(),
    }
    
    ;(global.WebSocket as jest.Mock).mockImplementation(() => mockWebSocket)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Render', () => {
    test('shows loading state initially', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Loading DiploSense...')).toBeInTheDocument()
    })

    test('renders main interface after mounting', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(screen.getByText('DiploSense')).toBeInTheDocument()
        expect(screen.getByText('Real-Time Diplomatic Intelligence Platform')).toBeInTheDocument()
      })
    })
  })

  describe('WebSocket Connection', () => {
    test('establishes WebSocket connection after mounting', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080/api/v1/ws/demo-meeting-1')
      })
    })

    test('shows connected status when WebSocket opens', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })
    })

    test('shows disconnected status when WebSocket closes', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })
      
      act(() => {
        triggerWebSocketClose(mockWebSocket)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Data Updates', () => {
    test('processes incoming WebSocket messages', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      await act(async () => {
        await waitForWebSocketMessage(mockWebSocket, mockDemoAnalysisData)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
      })
    })

    test('handles facial_analysis_update message type normalization', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      const facialUpdateMessage = {
        ...mockFacialAnalysisData,
        type: 'facial_analysis_update'
      }
      
      await act(async () => {
        await waitForWebSocketMessage(mockWebSocket, facialUpdateMessage)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Facial Analysis')).toBeInTheDocument()
      })
    })

    test('handles malformed WebSocket messages gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: 'invalid json' })
        }
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing WebSocket message:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Dashboard Integration', () => {
    test('passes analysis data to dashboard', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      await act(async () => {
        await waitForWebSocketMessage(mockWebSocket, mockDemoAnalysisData)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Emotion Score')).toBeInTheDocument()
        expect(screen.getByText('Stress Level')).toBeInTheDocument()
        expect(screen.getByText('Recent Analysis Activity')).toBeInTheDocument()
      })
    })

    test('dashboard updates with new data', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        triggerWebSocketOpen(mockWebSocket)
      })
      
      // Send first message
      await act(async () => {
        await waitForWebSocketMessage(mockWebSocket, mockDemoAnalysisData)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
      })
      
      // Send second message
      await act(async () => {
        await waitForWebSocketMessage(mockWebSocket, mockFacialAnalysisData)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
        expect(screen.getByText('Facial Analysis')).toBeInTheDocument()
      })
    })
  })

  describe('Upload Panel Integration', () => {
    test('renders upload panel', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Upload & Analysis')).toBeInTheDocument()
        expect(screen.getByText('Video Analysis')).toBeInTheDocument()
        expect(screen.getByText('Text Sentiment Analysis')).toBeInTheDocument()
      })
    })

    test('upload panel can trigger analysis', async () => {
      render(<HomePage />)
      
      await waitFor(() => {
        expect(screen.getByText('Quick Demo')).toBeInTheDocument()
      })
      
      // The actual API call testing would be done in UploadPanel tests
      // Here we just verify the component is rendered and accessible
    })
  })

  describe('Error Handling', () => {
    test('handles WebSocket errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      act(() => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Event('error'))
        }
      })
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Event))
      consoleSpy.mockRestore()
    })
  })
  
  describe('Component Lifecycle', () => {
    test('cleans up WebSocket on unmount', async () => {
      const { unmount } = render(<HomePage />)
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled()
      })
      
      unmount()
      
      expect(mockWebSocket.close).toHaveBeenCalled()
    })
  })
})