from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from services.openai_service import OpenAIService
from models.schemas import AnalysisRequest, AnalysisResponse
import json
import asyncio
from datetime import datetime
from typing import List, Optional
import cv2
import numpy as np
import tempfile
import os

router = APIRouter()
openai_service = OpenAIService()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()


@router.post("/analyze/video")
async def analyze_video(
    video_file: UploadFile = File(...),
    meeting_id: str = Form(...)
):
    """Analyze video for facial expressions and microexpressions"""
    try:
        video_data = await video_file.read()
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            temp_video.write(video_data)
            temp_video_path = temp_video.name

        cap = None
        try:
            cap = cv2.VideoCapture(temp_video_path)
            if not cap.isOpened():
                raise HTTPException(status_code=400, detail="Could not open video file")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_interval = max(1, total_frames // 10)  # Analyze up to 10 frames

            results = []
            for i in range(0, total_frames, frame_interval):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if not ret:
                    continue
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                analysis = await openai_service.analyze_facial_expressions(buffer.tobytes())
                results.append({"frame": i, "analysis": analysis})
                # Send partial result via WebSocket
                await manager.broadcast(json.dumps({
                    "type": "facial_analysis_update",
                    "meeting_id": meeting_id,
                    "data": analysis,
                    "frame": i,
                    "timestamp": datetime.now().isoformat()
                }))
                await asyncio.sleep(0.1)  # Small delay to avoid flooding

            # Send final summary
            await manager.broadcast(json.dumps({
                "type": "facial_analysis_complete",
                "meeting_id": meeting_id,
                "data": results,
                "timestamp": datetime.now().isoformat()
            }))

            cap.release()
            os.unlink(temp_video_path)

            return JSONResponse(content={
                "meeting_id": meeting_id,
                "analysis": results,
                "timestamp": datetime.now().isoformat()
            })

        finally:
            if cap:
                cap.release()
            if os.path.exists(temp_video_path):
                os.unlink(temp_video_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/text")
async def analyze_text(
    text: str = Form(...),
    meeting_id: str = Form(...),
    cultures: str = Form("[]")
):
    """Analyze text for sentiment and cultural context"""
    try:
        culture_list = json.loads(cultures) if cultures else []
        analysis = await openai_service.analyze_text_sentiment(text, culture_list)

        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "text_analysis",
            "meeting_id": meeting_id,
            "data": analysis,
            "timestamp": datetime.now().isoformat()
        }))

        return JSONResponse(content={
            "meeting_id": meeting_id,
            "analysis": analysis,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/cable")
async def generate_cable(
    meeting_id: str = Form(...),
    analysis_data: str = Form(...)
):
    """Generate diplomatic cable from analysis data"""
    try:
        data = json.loads(analysis_data)
        cable = await openai_service.generate_diplomatic_cable(data)

        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "diplomatic_cable",
            "meeting_id": meeting_id,
            "data": cable,
            "timestamp": datetime.now().isoformat()
        }))

        return JSONResponse(content={
            "meeting_id": meeting_id,
            "cable": cable,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def extract_and_analyze_frame(video_source: str, frame_progress: float):
    """Extract frame from video at specific progress and analyze with OpenAI"""
    try:
        # Convert video URL to local file path
        if video_source.startswith('/demo-data/'):
            # Use the full path as-is since it's already correct
            video_path = video_source
        else:
            video_path = video_source
            
        # Open video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video file: {video_path}")
        
        try:
            # Calculate frame position based on progress
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            target_frame = int(total_frames * frame_progress)
            current_time = target_frame / fps
            
            # Set frame position
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            ret, frame = cap.read()
            
            if not ret:
                raise Exception(f"Could not read frame at position {target_frame}")
            
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            print(f"[VIDEO ANALYSIS] Extracted frame {target_frame}/{total_frames} from {video_path}")
            print(f"[VIDEO ANALYSIS] Frame at {frame_progress*100:.1f}% progress, calling OpenAI...")
            
            # Analyze visual content with OpenAI
            analysis = await openai_service.analyze_facial_expressions(buffer.tobytes(), "demo_video")
            
            # Extract and transcribe audio segment
            audio_transcript = await extract_and_transcribe_audio(video_path, current_time, fps)
            if audio_transcript:
                analysis["transcript"] = audio_transcript
            
            print(f"[VIDEO ANALYSIS] OpenAI analysis completed for frame {target_frame}")
            
            # Add frame metadata
            analysis["frame_time"] = current_time
            analysis["frame_number"] = target_frame
            analysis["total_frames"] = total_frames
            
            cap.release()
            return analysis
            
        finally:
            cap.release()
            
    except Exception as e:
        print(f"Error extracting and analyzing frame: {e}")
        # Return fallback analysis
        return {
            "frame_time": frame_progress * 30,
            "emotions": [
                {"emotion": "neutral", "confidence": 0.8},
                {"emotion": "focused", "confidence": 0.6}
            ],
            "microexpressions": ["subtle_concentration"],
            "overall_confidence_score": 0.7,
            "error": f"Frame extraction failed: {str(e)}"
        }

async def extract_and_transcribe_audio(video_path: str, current_time: float, fps: float):
    """Extract audio segment from video and transcribe with Whisper"""
    try:
        import tempfile
        import subprocess
        
        # Create temporary audio file for this segment
        # Extract 2-second audio clip around current time
        start_time = max(0, current_time - 1)  # 1 second before
        duration = 2  # 2 seconds total
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
            temp_audio_path = temp_audio.name
        
        # Use ffmpeg to extract audio segment
        ffmpeg_cmd = [
            'ffmpeg', '-i', video_path,
            '-ss', str(start_time),
            '-t', str(duration),
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',  # Overwrite output file
            temp_audio_path
        ]
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[AUDIO] FFmpeg error: {result.stderr}")
            return None
        
        # Check if audio file has content
        if os.path.getsize(temp_audio_path) < 1000:  # Less than 1KB, probably silent
            os.unlink(temp_audio_path)
            return None
        
        print(f"[AUDIO] Extracted {duration}s audio segment at {current_time:.1f}s, transcribing...")
        
        # Transcribe with OpenAI Whisper
        with open(temp_audio_path, 'rb') as audio_file:
            transcript = await openai_service.transcribe_audio(audio_file.read(), "demo_video")
        
        # Clean up temp file
        os.unlink(temp_audio_path)
        
        if transcript and transcript.strip():
            print(f"[AUDIO] Transcription: {transcript}")
            return transcript.strip()
        
        return None
        
    except Exception as e:
        print(f"Error in audio transcription: {e}")
        return None

@router.post("/analyze/demo-video")
async def analyze_demo_video(request: dict):
    """Analyze demo video with progressive updates using real OpenAI analysis"""
    try:
        meeting_id = request.get("meeting_id", "demo")
        video_source = request.get("video_source", "")
        frame_progress = request.get("frame_progress", 0)
        
        # Send video analysis update
        await manager.broadcast(json.dumps({
            "type": "video_analysis_progress",
            "meeting_id": meeting_id,
            "data": {
                "video_source": video_source,
                "progress": frame_progress,
                "status": "analyzing"
            },
            "timestamp": datetime.now().isoformat()
        }))
        
        # Extract and analyze actual video frame
        frame_analysis = await extract_and_analyze_frame(video_source, frame_progress)
        
        # Send facial analysis update
        await manager.broadcast(json.dumps({
            "type": "facial_analysis_update",
            "meeting_id": meeting_id,
            "data": frame_analysis,
            "frame_progress": frame_progress,
            "timestamp": datetime.now().isoformat()
        }))
        
        return JSONResponse(content={
            "meeting_id": meeting_id,
            "analysis": frame_analysis,
            "progress": frame_progress,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in demo video analysis: {e}")
        # Fall back to mock data if real analysis fails
        frame_analysis = {
            "frame_time": frame_progress * 30,
            "emotions": [
                {"emotion": "focused", "confidence": 0.7 + (frame_progress * 0.2)},
                {"emotion": "tense", "confidence": 0.3 + (frame_progress * 0.3)},
                {"emotion": "determined", "confidence": 0.6 + (frame_progress * 0.1)}
            ],
            "microexpressions": ["eyebrow_furrow", "lip_tightening"],
            "overall_confidence_score": 0.75 + (frame_progress * 0.15),
            "error": f"Fallback to mock data: {str(e)}"
        }
        
        await manager.broadcast(json.dumps({
            "type": "facial_analysis_update",
            "meeting_id": meeting_id,
            "data": frame_analysis,
            "frame_progress": frame_progress,
            "timestamp": datetime.now().isoformat()
        }))
        
        return JSONResponse(content={
            "meeting_id": meeting_id,
            "analysis": frame_analysis,
            "progress": frame_progress,
            "timestamp": datetime.now().isoformat()
        })

@router.post("/analyze/live-camera")
async def analyze_live_camera(request: dict):
    """Analyze live camera feed with real-time processing"""
    try:
        meeting_id = request.get("meeting_id", "live")
        image_data = request.get("image_data", [])
        timestamp = request.get("timestamp", datetime.now().isoformat())
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Convert image data back to bytes
        image_bytes = bytes(image_data)
        
        print(f"[LIVE CAMERA] Received frame for analysis, size: {len(image_bytes)} bytes")
        
        # Analyze with OpenAI
        analysis = await openai_service.analyze_facial_expressions(image_bytes, meeting_id)
        
        # Add live metadata
        analysis["source"] = "live_camera"
        analysis["timestamp"] = timestamp
        
        # Send facial analysis update via WebSocket
        await manager.broadcast(json.dumps({
            "type": "facial_analysis_update",
            "meeting_id": meeting_id,
            "data": analysis,
            "timestamp": timestamp
        }))
        
        print(f"[LIVE CAMERA] Analysis completed and broadcasted")
        
        return JSONResponse(content={
            "meeting_id": meeting_id,
            "analysis": analysis,
            "timestamp": timestamp
        })
        
    except Exception as e:
        print(f"Error in live camera analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/demo/analyze")
async def demo_analyze(request: dict):
    """Demo analysis using sample diplomatic meeting video"""
    try:
        meeting_id = request.get("meeting_id", "demo")

        # Simulate video analysis with sample diplomatic scenario
        demo_analysis = {
            "facial_expressions": {
                "participant_1": {
                    "nationality": "American",
                    "primary_emotion": "confident",
                    "secondary_emotion": "slightly_tense",
                    "micro_expressions": ["brief_eyebrow_flash", "lip_compression"],
                    "confidence_level": 0.8,
                    "stress_indicators": ["minimal_jaw_tension"]
                },
                "participant_2": {
                    "nationality": "Chinese",
                    "primary_emotion": "composed",
                    "secondary_emotion": "cautious",
                    "micro_expressions": ["eye_narrowing", "controlled_breathing"],
                    "confidence_level": 0.9,
                    "stress_indicators": ["none_detected"]
                }
            },
            "body_language": {
                "participant_1": {
                    "posture": "leaning_forward",
                    "gesture_frequency": "high",
                    "gesture_type": "pointing_emphatic",
                    "cultural_interpretation": "American direct communication style"
                },
                "participant_2": {
                    "posture": "upright_formal",
                    "gesture_frequency": "low",
                    "gesture_type": "minimal_controlled",
                    "cultural_interpretation": "Chinese formal diplomatic approach"
                }
            },
            "cultural_dynamics": {
                "communication_mismatch": "high_directness_vs_indirect",
                "potential_tension_points": ["time_pressure", "decision_making_pace"],
                "recommended_adjustments": [
                    "American delegate: Slow down delivery, allow processing time",
                    "Chinese delegate: Consider more explicit verbal confirmations"
                ]
            },
            "overall_assessment": {
                "tension_level": "moderate",
                "cooperation_probability": 0.7,
                "key_insights": [
                    "Cultural communication styles creating minor friction",
                    "Both parties showing professional restraint",
                    "Opportunity for cultural bridge-building"
                ]
            }
        }

        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "demo_analysis",
            "meeting_id": meeting_id,
            "data": demo_analysis,
            "timestamp": datetime.now().isoformat()
        }))

        return JSONResponse(content={
            "meeting_id": meeting_id,
            "analysis": demo_analysis,
            "timestamp": datetime.now().isoformat(),
            "demo": True
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back the message (you can add more logic here)
            await manager.send_personal_message(f"Message received for meeting {meeting_id}: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)