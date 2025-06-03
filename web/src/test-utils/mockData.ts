export const mockFacialAnalysisData = {
  type: 'facial_analysis',
  meeting_id: 'test-meeting-1',
  timestamp: '2025-06-03T12:00:00.000Z',
  data: {
    emotions: [
      { emotion: 'confident', confidence: 0.8 },
      { emotion: 'calm', confidence: 0.6 },
      { emotion: 'focused', confidence: 0.7 }
    ],
    microexpressions: ['slight_eyebrow_raise', 'minimal_jaw_tension'],
    overall_confidence_score: 0.75
  }
}

export const mockDemoAnalysisData = {
  type: 'demo_analysis',
  meeting_id: 'test-meeting-1',
  timestamp: '2025-06-03T12:01:00.000Z',
  data: {
    facial_expressions: {
      participant_1: {
        nationality: 'American',
        primary_emotion: 'confident',
        confidence_level: 0.8
      }
    },
    overall_assessment: {
      tension_level: 'moderate',
      cooperation_probability: 0.7,
      key_insights: [
        'Cultural communication styles creating minor friction',
        'Both parties showing professional restraint'
      ]
    },
    cultural_dynamics: {
      recommended_adjustments: [
        'American delegate: Slow down delivery',
        'Chinese delegate: More explicit confirmations'
      ]
    }
  }
}

export const mockDiplomaticCableData = {
  type: 'diplomatic_cable',
  meeting_id: 'test-meeting-1',
  timestamp: '2025-06-03T12:02:00.000Z',
  data: {
    executive_summary: 'Meeting showed moderate tension with opportunities for bridge-building.',
    risk_assessment: {
      risk_level: 'Medium',
      recommendations: [
        'Monitor communication patterns',
        'Implement cultural sensitivity training'
      ]
    },
    cultural_analysis: {
      cultural_insights: {
        communication_mismatch: 'high_directness_vs_indirect'
      }
    }
  }
}

export const mockTextAnalysisData = {
  type: 'text_analysis',
  meeting_id: 'test-meeting-1',
  timestamp: '2025-06-03T12:03:00.000Z',
  data: {
    sentiment: 'neutral',
    polarity: 0.1,
    cultural_flags: ['time_pressure_sensitivity'],
    communication_style_analysis: {
      directness: 'high',
      formality: 'medium'
    }
  }
}

export const mockAnalysisDataArray = [
  mockFacialAnalysisData,
  mockDemoAnalysisData,
  mockDiplomaticCableData,
  mockTextAnalysisData
]

export const mockEmotionChartData = [
  { time: 1, emotion: 0.5, stress: 0.2, timestamp: '12:00:00' },
  { time: 2, emotion: 0.1, stress: 0.5, timestamp: '12:01:00' },
  { time: 3, emotion: -0.2, stress: 0.7, timestamp: '12:02:00' }
]