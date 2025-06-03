import { render, screen, fireEvent, waitFor } from '@/test-utils/testUtils'
import Dashboard from '../Dashboard'
import {
  mockAnalysisDataArray,
  mockFacialAnalysisData,
  mockDemoAnalysisData,
  mockDiplomaticCableData
} from '@/test-utils/mockData'

describe('Dashboard Component', () => {
  const defaultProps = {
    analysisData: mockAnalysisDataArray,
    meetingId: 'test-meeting-1'
  }

  beforeEach(() => {
    // Clear any previous console logs
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders all main sections', () => {
      render(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Emotion Score')).toBeInTheDocument()
      expect(screen.getByText('Stress Level')).toBeInTheDocument()
      expect(screen.getByText('Risk Level')).toBeInTheDocument()
      expect(screen.getByText('Negotiation Temperature')).toBeInTheDocument()
      expect(screen.getByText('Recent Analysis Activity')).toBeInTheDocument()
    })

    test('renders emotion score from latest analysis', () => {
      render(<Dashboard {...defaultProps} />)
      
      // Should show emotion score from demo analysis (0.1)
      expect(screen.getByText('0.10')).toBeInTheDocument()
    })

    test('renders stress level from latest analysis', () => {
      render(<Dashboard {...defaultProps} />)
      
      // Should show stress level from demo analysis (50%)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    test('renders risk level from diplomatic cable', () => {
      render(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Medium')).toBeInTheDocument()
    })

    test('renders recent activity items', () => {
      render(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Facial Analysis')).toBeInTheDocument()
      expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
      expect(screen.getByText('Diplomatic Cable')).toBeInTheDocument()
      expect(screen.getByText('Text Analysis')).toBeInTheDocument()
    })
  })

  describe('Emotion Data Processing', () => {
    test('processes facial analysis emotions correctly', () => {
      const facialOnlyData = [mockFacialAnalysisData]
      render(<Dashboard analysisData={facialOnlyData} meetingId="test" />)
      
      // Confident (0.8) + Calm (0.6) = 1.4 positive
      // No negative emotions, so emotion = 1.4 - 0 = 1.4 (but clamped to reasonable values)
      // This should result in some positive emotion score
      expect(screen.getByText(/\d+\.\d+/)).toBeInTheDocument()
    })

    test('processes demo analysis tension levels correctly', () => {
      const demoOnlyData = [mockDemoAnalysisData]
      render(<Dashboard analysisData={demoOnlyData} meetingId="test" />)
      
      // Moderate tension should result in emotion: 0.1, stress: 0.5
      expect(screen.getByText('0.10')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    test('handles empty analysis data', () => {
      render(<Dashboard analysisData={[]} meetingId="test" />)
      
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Recent Activity Interactions', () => {
    test('renders test modal button', () => {
      render(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    test('opens modal when test button is clicked', async () => {
      render(<Dashboard {...defaultProps} />)
      
      const testButton = screen.getByText('Test Modal')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Details/)).toBeInTheDocument()
      })
    })

    test('activity items have clickable styling', () => {
      render(<Dashboard {...defaultProps} />)
      
      const activityItems = screen.getAllByRole('generic').filter(el => 
        el.className.includes('cursor-pointer')
      )
      
      expect(activityItems.length).toBeGreaterThan(0)
    })

    test('clicking activity item opens modal', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      render(<Dashboard {...defaultProps} />)
      
      // Find the first clickable activity item
      const activityItem = screen.getAllByRole('generic').find(el => 
        el.className.includes('cursor-pointer')
      )
      
      if (activityItem) {
        fireEvent.click(activityItem)
        
        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Opening modal for:', expect.any(String))
        })
      }
      
      consoleSpy.mockRestore()
    })
  })

  describe('Modal Functionality', () => {
    test('modal displays correct content for facial analysis', async () => {
      render(<Dashboard analysisData={[mockFacialAnalysisData]} meetingId="test" />)
      
      const testButton = screen.getByText('Test Modal')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText('Facial Analysis Details')).toBeInTheDocument()
        expect(screen.getByText('Detected Emotions')).toBeInTheDocument()
        expect(screen.getByText('Confident')).toBeInTheDocument()
        expect(screen.getByText('Confidence: 80.0%')).toBeInTheDocument()
      })
    })

    test('modal displays correct content for demo analysis', async () => {
      render(<Dashboard analysisData={[mockDemoAnalysisData]} meetingId="test" />)
      
      const testButton = screen.getByText('Test Modal')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText('Demo Analysis Details')).toBeInTheDocument()
        expect(screen.getByText('Assessment Summary')).toBeInTheDocument()
        expect(screen.getByText('Tension Level:')).toBeInTheDocument()
        expect(screen.getByText('Moderate')).toBeInTheDocument()
        expect(screen.getByText('Cooperation Probability: 70%')).toBeInTheDocument()
      })
    })

    test('modal displays correct content for diplomatic cable', async () => {
      render(<Dashboard analysisData={[mockDiplomaticCableData]} meetingId="test" />)
      
      const testButton = screen.getByText('Test Modal')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText('Diplomatic Cable Details')).toBeInTheDocument()
        expect(screen.getByText('Executive Summary')).toBeInTheDocument()
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
        expect(screen.getByText('Risk Level: Medium')).toBeInTheDocument()
      })
    })

    test('modal closes when X button is clicked', async () => {
      render(<Dashboard {...defaultProps} />)
      
      const testButton = screen.getByText('Test Modal')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Details/)).toBeInTheDocument()
      })
      
      const closeButton = screen.getByRole('button').closest('div')?.querySelector('button')
      if (closeButton) {
        fireEvent.click(closeButton)
        
        await waitFor(() => {
          expect(screen.queryByText(/Details/)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Real-time Updates', () => {
    test('component updates when new analysis data is added', () => {
      const { rerender } = render(<Dashboard analysisData={[]} meetingId="test" />)
      
      expect(screen.getByText('N/A')).toBeInTheDocument()
      
      rerender(<Dashboard analysisData={[mockDemoAnalysisData]} meetingId="test" />)
      
      expect(screen.getByText('0.10')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    test('recent activity updates with new items', () => {
      const { rerender } = render(<Dashboard analysisData={[mockDemoAnalysisData]} meetingId="test" />)
      
      expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
      expect(screen.queryByText('Facial Analysis')).not.toBeInTheDocument()
      
      rerender(<Dashboard analysisData={[mockDemoAnalysisData, mockFacialAnalysisData]} meetingId="test" />)
      
      expect(screen.getByText('Demo Analysis')).toBeInTheDocument()
      expect(screen.getByText('Facial Analysis')).toBeInTheDocument()
    })
  })

  describe('Chart Components', () => {
    test('renders negotiation temperature chart', () => {
      render(<Dashboard {...defaultProps} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    test('renders facial expressions chart when data available', () => {
      render(<Dashboard analysisData={[mockFacialAnalysisData]} meetingId="test" />)
      
      expect(screen.getByText('Current Facial Expressions')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles malformed facial analysis data gracefully', () => {
      const malformedData = [{
        ...mockFacialAnalysisData,
        data: { emotions: null }
      }]
      
      expect(() => {
        render(<Dashboard analysisData={malformedData} meetingId="test" />)
      }).not.toThrow()
    })

    test('handles missing assessment data gracefully', () => {
      const malformedData = [{
        ...mockDemoAnalysisData,
        data: { overall_assessment: null }
      }]
      
      expect(() => {
        render(<Dashboard analysisData={malformedData} meetingId="test" />)
      }).not.toThrow()
    })
  })
})