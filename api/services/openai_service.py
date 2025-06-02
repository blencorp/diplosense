import openai
from config import settings
import base64
import io
from PIL import Image
import numpy as np
from typing import List, Dict, Any
import json

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

    async def analyze_facial_expressions(self, image_data: bytes) -> Dict[str, Any]:
        """Analyze facial microexpressions using GPT-4o vision"""
        try:
            # Convert image to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in facial microexpression analysis for diplomatic settings. Analyze the facial expressions in this image and identify any microexpressions that might indicate stress, deception, frustration, confidence, or other emotions relevant to negotiations. Return a JSON response with emotions (list of objects with emotion and confidence), microexpressions (list), and overall_confidence_score (0 to 1)."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze the facial expressions and microexpressions in this diplomatic meeting image:"
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
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Error in facial expression analysis: {e}")
            return {"error": str(e)}

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