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

@router.post("/analyze/audio")
async def analyze_audio(
    audio_file: UploadFile = File(...),
    meeting_id: str = Form(...)
):
    """Analyze audio for emotional tone and stress"""
    try:
        audio_data = await audio_file.read()
        analysis = await openai_service.analyze_audio_emotion(audio_data)
        
        # Broadcast to WebSocket clients
        await manager.broadcast(json.dumps({
            "type": "audio_analysis",
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

@router.post("/analyze/video")
async def analyze_video(
    video_file: UploadFile = File(...),
    meeting_id: str = Form(...)
):
    """Analyze video for facial expressions and microexpressions"""
    try:
        video_data = await video_file.read()
        
        # Extract frames from video
        nparr = np.frombuffer(video_data, np.uint8)
        cap = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cap is None:
            # If it's an image, analyze directly
            analysis = await openai_service.analyze_facial_expressions(video_data)
        else:
            # For video, extract a frame
            ret, frame = cap.read()
            if ret:
                _, buffer = cv2.imencode('.jpg', frame)
                analysis = await openai_service.analyze_facial_expressions(buffer.tobytes())
            else:
                raise HTTPException(status_code=400, detail="Could not process video file")
        
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