import openai
from config import settings
import base64
import io
import time
from PIL import Image
import numpy as np
from typing import List, Dict, Any
import json
# from .usage_tracker import usage_tracker  # Temporarily disabled
from .simple_usage_tracker import simple_usage_tracker

class OpenAIService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_audio_emotion(self, audio_data: bytes) -> Dict[str, Any]:
        """Analyze emotional tone from audio using OpenAI"""
        try:
            # Transcribe audio first
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.wav"
            
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            
            # Analyze emotion from transcript
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in diplomatic communication analysis. Analyze the emotional tone, stress level, and overall sentiment of the following transcript. Return a JSON response with emotion_score (-1 to 1), stress_level (0 to 1), tone (calm/neutral/tense/aggressive), and detected_emotions (list)."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this diplomatic transcript: {transcript.text}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["transcript"] = transcript.text
            return result
            
        except Exception as e:
            print(f"Error in audio emotion analysis: {e}")
            return {"error": str(e)}

    async def analyze_facial_expressions(self, image_data: bytes, meeting_id: str = None) -> Dict[str, Any]:
        """Analyze facial microexpressions using GPT-4o vision"""
        # Start usage tracking
        start_time = time.time()
        
        try:
            # Convert image to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            print(f"[OpenAI] Making facial expression analysis request to GPT-4o Vision")
            print(f"[OpenAI] Image size: {len(image_data)} bytes")
            
            request_data = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert in behavioral analysis for diplomatic settings. Analyze the general emotional tone and body language visible in this image without identifying any individuals. Focus on observable behavioral indicators like posture, gesture patterns, and general emotional atmosphere. Return a JSON response with emotions (list of objects with emotion and confidence), observable_behaviors (list), and overall_confidence_score (0 to 1)."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze the general behavioral and emotional indicators in this scene without identifying any individuals:"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            
            response = self.client.chat.completions.create(**request_data)
            
            result = json.loads(response.choices[0].message.content)
            print(f"[OpenAI] Response received from GPT-4o Vision:")
            print(f"[OpenAI] Usage: {response.usage}")
            print(f"[OpenAI] Analysis result: {result}")
            
            # Log usage with simple tracker
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            tokens = response.usage.total_tokens
            cost = simple_usage_tracker.estimate_openai_cost("gpt-4o", tokens)
            
            simple_usage_tracker.log_request(
                service="openai_vision",
                model="gpt-4o", 
                tokens=tokens,
                cost=cost,
                response_time_ms=response_time_ms,
                meeting_id=meeting_id
            )
            
            return result
            
        except Exception as e:
            print(f"Error in facial expression analysis: {e}")
            # Log error (temporarily disabled)
            # await usage_tracker.log_openai_request(
            #     tracking_context, {}, {}, "gpt-4o", meeting_id, str(e)
            # )
            return {"error": str(e)}

    async def transcribe_audio(self, audio_data: bytes, meeting_id: str = None) -> str:
        """Transcribe audio using OpenAI Whisper"""
        # Start usage tracking
        start_time = time.time()
        
        try:
            import io
            
            print(f"[OpenAI] Making audio transcription request to Whisper")
            print(f"[OpenAI] Audio size: {len(audio_data)} bytes")
            
            # Create file-like object for Whisper API
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.wav"
            
            request_data = {
                "model": "whisper-1",
                "file": "[AUDIO_DATA]",
                "response_format": "text"
            }
            
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            
            print(f"[OpenAI] Whisper transcription result: {transcript}")
            
            # Log usage with simple tracker
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            # Estimate tokens for Whisper (audio duration based)
            estimated_tokens = max(10, len(transcript.split()) * 1.3) if transcript else 10
            cost = simple_usage_tracker.estimate_openai_cost("whisper-1", int(estimated_tokens))
            
            simple_usage_tracker.log_request(
                service="openai_whisper",
                model="whisper-1",
                tokens=int(estimated_tokens),
                cost=cost,
                response_time_ms=response_time_ms,
                meeting_id=meeting_id
            )
            
            return transcript
            
        except Exception as e:
            print(f"Error in audio transcription: {e}")
            # Log error with simple tracker
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            simple_usage_tracker.log_request(
                service="openai_whisper",
                model="whisper-1",
                tokens=0,
                cost=0.0,
                response_time_ms=response_time_ms,
                meeting_id=meeting_id,
                error=str(e)
            )
            return ""

    async def analyze_text_sentiment(self, text: str, cultures: List[str] = []) -> Dict[str, Any]:
        """Analyze text sentiment and cultural context"""
        try:
            from .cultural_engine import CulturalEngine
            cultural_engine = CulturalEngine()
            
            culture_context = ""
            if cultures:
                culture_context = f" Consider the cultural backgrounds: {', '.join(cultures)}."
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert in diplomatic communication and cross-cultural analysis. Analyze the sentiment, cultural implications, and potential friction points in this text.{culture_context} Return JSON with sentiment (positive/negative/neutral), polarity (-1 to 1), cultural_flags (list of potential issues), and communication_style_analysis."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this diplomatic text: {text}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add cultural engine analysis
            cultural_analysis = cultural_engine.analyze_cultural_context(cultures, text)
            cultural_flags = cultural_engine.flag_cultural_issues_in_text(text, cultures)
            
            result["cultural_analysis"] = cultural_analysis
            result["cultural_flags_detailed"] = cultural_flags
            
            return result
            
        except Exception as e:
            print(f"Error in text sentiment analysis: {e}")
            return {"error": str(e)}

    async def generate_diplomatic_cable(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate diplomatic cable using multi-agent approach"""
        try:
            # First agent: Summarize key findings
            summary_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a senior diplomatic analyst. Summarize the key findings from this multimodal analysis data into a concise executive summary for a diplomatic cable."
                    },
                    {
                        "role": "user",
                        "content": f"Analysis data: {json.dumps(analysis_data, indent=2)}"
                    }
                ]
            )
            
            # Second agent: Risk assessment and recommendations
            risk_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a diplomatic risk assessor. Based on this analysis, provide a risk level (LOW/MEDIUM/HIGH) and specific recommendations for diplomatic strategy. Return JSON format."
                    },
                    {
                        "role": "user",
                        "content": f"Analysis data: {json.dumps(analysis_data, indent=2)}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            # Third agent: Cultural context and strategic advice
            cultural_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a cultural affairs expert. Provide cultural context and strategic communication advice based on this analysis. Return JSON format with cultural_insights and strategic_recommendations."
                    },
                    {
                        "role": "user",
                        "content": f"Analysis data: {json.dumps(analysis_data, indent=2)}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            # Combine results
            cable = {
                "executive_summary": summary_response.choices[0].message.content,
                "risk_assessment": json.loads(risk_response.choices[0].message.content),
                "cultural_analysis": json.loads(cultural_response.choices[0].message.content),
                "raw_analysis": analysis_data
            }
            
            return cable
            
        except Exception as e:
            print(f"Error in diplomatic cable generation: {e}")
            return {"error": str(e)}

    async def analyze_news_text(self, text: str, analysis_type: str = "diplomatic") -> Dict[str, Any]:
        """Analyze news text for diplomatic intelligence"""
        start_time = time.time()
        
        try:
            print(f"[OpenAI] Making news analysis request to GPT-4o")
            print(f"[OpenAI] Text length: {len(text)} characters")
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a senior diplomatic intelligence analyst. Analyze the provided text and provide comprehensive diplomatic intelligence including:

1. A diplomatic overview of the situation
2. Risk level assessment (low/medium/high/critical)
3. Strategic recommendations for diplomatic response
4. Key entities, countries, or organizations mentioned
5. Sentiment analysis with confidence score
6. Geopolitical implications

Return your analysis in valid JSON format with the following structure:
{
  "diplomatic_overview": "Brief overview of the diplomatic situation",
  "risk_level": "low|medium|high|critical",
  "strategic_recommendations": ["recommendation 1", "recommendation 2"],
  "key_entities": ["entity 1", "entity 2"],
  "sentiment_analysis": {
    "overall_sentiment": "positive|negative|neutral",
    "confidence": 0.85
  },
  "geopolitical_implications": ["implication 1", "implication 2"]
}"""
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this text for diplomatic intelligence:\n\n{text}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            print(f"[OpenAI] News analysis completed successfully")
            print(f"[OpenAI] Usage: {response.usage}")
            
            # Log usage with simple tracker
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            tokens = response.usage.total_tokens
            cost = simple_usage_tracker.estimate_openai_cost("gpt-4o", tokens)
            
            simple_usage_tracker.log_request(
                service="openai_news_analysis",
                model="gpt-4o",
                tokens=tokens,
                cost=cost,
                response_time_ms=response_time_ms,
                meeting_id="news_analysis"
            )
            
            return result
            
        except Exception as e:
            print(f"Error in news analysis: {e}")
            # Log error
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            simple_usage_tracker.log_request(
                service="openai_news_analysis",
                model="gpt-4o",
                tokens=0,
                cost=0.0,
                response_time_ms=response_time_ms,
                meeting_id="news_analysis",
                error=str(e)
            )
            return {"error": str(e)}