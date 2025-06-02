from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class EmotionAnalysis(BaseModel):
    emotion: str
    confidence: float
    timestamp: datetime

class VoiceAnalysis(BaseModel):
    text: str
    emotion_score: float
    stress_level: float
    tone: str
    timestamp: datetime

class FacialAnalysis(BaseModel):
    emotions: List[EmotionAnalysis]
    microexpressions: List[str]
    confidence_score: float
    timestamp: datetime

class TextSentiment(BaseModel):
    text: str
    sentiment: str
    polarity: float
    cultural_flags: List[str]
    timestamp: datetime

class CulturalContext(BaseModel):
    culture: str
    communication_style: str
    directness_score: float
    formality_level: str
    potential_mismatches: List[str]

class DiplomaticCable(BaseModel):
    summary: str
    key_insights: List[str]
    emotional_indicators: Dict[str, Any]
    cultural_assessment: CulturalContext
    risk_level: str
    recommendations: List[str]
    metadata: Dict[str, Any]
    timestamp: datetime

class AnalysisRequest(BaseModel):
    meeting_id: str
    audio_file: Optional[str] = None
    video_file: Optional[str] = None
    transcript: Optional[str] = None
    participant_cultures: List[str] = []

class AnalysisResponse(BaseModel):
    meeting_id: str
    voice_analysis: Optional[VoiceAnalysis] = None
    facial_analysis: Optional[FacialAnalysis] = None
    text_sentiment: Optional[TextSentiment] = None
    cultural_context: Optional[CulturalContext] = None
    diplomatic_cable: Optional[DiplomaticCable] = None
    status: str