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
        # Read video data
        video_data = await video_file.read()

        # Create a temporary file to store the video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            temp_video.write(video_data)
            temp_video_path = temp_video.name

        try:
            # Open video file using OpenCV
            cap = cv2.VideoCapture(temp_video_path)
            if not cap.isOpened():
                raise HTTPException(status_code=400, detail="Could not open video file")

            # Extract a frame from the middle of the video
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total_frames > 0:
                # Seek to middle frame
                cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
                ret, frame = cap.read()
                if ret:
                    # Convert frame to JPEG format
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    analysis = await openai_service.analyze_facial_expressions(buffer.tobytes())
                else:
                    raise HTTPException(status_code=400, detail="Could not extract frame from video")
            else:
                raise HTTPException(status_code=400, detail="Video file appears to be empty")

        finally:
            # Clean up
            cap.release()
            os.unlink(temp_video_path)

        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "facial_analysis",
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