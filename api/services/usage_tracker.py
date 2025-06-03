import time
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text, func
from models.usage import APIUsage, Base
from config import settings
import asyncio
from datetime import datetime

class UsageTracker:
    def __init__(self):
        # Use the same database as Supabase for simplicity
        self.database_url = f"postgresql://postgres:postgres@supabase-db:5432/postgres"
        self.engine = create_engine(self.database_url)
        self._ensure_tables()
    
    def _ensure_tables(self):
        """Create tables if they don't exist"""
        try:
            Base.metadata.create_all(bind=self.engine)
            print("[USAGE] Database tables created/verified")
        except Exception as e:
            print(f"[USAGE] Error creating tables: {e}")
    
    def get_session(self):
        """Get database session"""
        from sqlalchemy.orm import sessionmaker
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        return SessionLocal()
    
    def start_request(self, service: str, endpoint: str, method: str = "POST") -> Dict[str, Any]:
        """Start tracking a new API request"""
        return {
            "service": service,
            "endpoint": endpoint, 
            "method": method,
            "start_time": time.time(),
            "request_timestamp": datetime.now()
        }
    
    async def log_openai_request(
        self,
        tracking_context: Dict[str, Any],
        request_data: Dict[str, Any],
        response_data: Dict[str, Any],
        model: str,
        meeting_id: str = None,
        error: str = None
    ):
        """Log OpenAI API request with detailed tracking"""
        try:
            end_time = time.time()
            response_time_ms = (end_time - tracking_context["start_time"]) * 1000
            
            # Calculate token usage and cost
            tokens_prompt = 0
            tokens_completion = 0
            tokens_total = 0
            estimated_cost = 0.0
            
            if "usage" in response_data:
                usage = response_data["usage"]
                tokens_prompt = usage.get("prompt_tokens", 0)
                tokens_completion = usage.get("completion_tokens", 0)
                tokens_total = usage.get("total_tokens", 0)
                
                # Estimate cost based on model
                estimated_cost = self._estimate_openai_cost(model, tokens_prompt, tokens_completion)
            
            # Sanitize request data (remove sensitive info)
            sanitized_request = self._sanitize_request(request_data)
            
            # Create usage record
            usage_record = APIUsage(
                service=tracking_context["service"],
                endpoint=tracking_context["endpoint"],
                method=tracking_context["method"],
                request_payload=sanitized_request,
                request_size_bytes=len(json.dumps(sanitized_request).encode()),
                response_data=response_data,
                response_size_bytes=len(json.dumps(response_data).encode()),
                status_code=200 if not error else 500,
                request_timestamp=tracking_context["request_timestamp"],
                response_time_ms=response_time_ms,
                model_used=model,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                estimated_cost_usd=estimated_cost,
                meeting_id=meeting_id,
                error_message=error,
                error_type=type(error).__name__ if error else None
            )
            
            # Save to database
            session = self.get_session()
            try:
                session.add(usage_record)
                session.commit()
                print(f"[USAGE] Logged {tracking_context['service']} request: {tokens_total} tokens, ${estimated_cost:.4f}")
            finally:
                session.close()
                
        except Exception as e:
            print(f"[USAGE] Error logging API usage: {e}")
    
    def _sanitize_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from request before storing"""
        sanitized = request_data.copy()
        
        # Remove or truncate large data
        if "messages" in sanitized:
            for message in sanitized["messages"]:
                if "content" in message and isinstance(message["content"], list):
                    for content in message["content"]:
                        if content.get("type") == "image_url":
                            # Replace image data with metadata
                            content["image_url"] = {
                                "url": "[IMAGE_DATA_REMOVED]",
                                "detail": content.get("image_url", {}).get("detail", "auto")
                            }
        
        # Remove binary data
        if "file" in sanitized:
            sanitized["file"] = "[AUDIO_DATA_REMOVED]"
            
        return sanitized
    
    def _estimate_openai_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Estimate cost based on OpenAI pricing"""
        # Pricing as of December 2024 (approximate)
        pricing = {
            "gpt-4o": {"input": 0.0025, "output": 0.01},  # per 1K tokens
            "gpt-4": {"input": 0.03, "output": 0.06},
            "whisper-1": {"input": 0.006, "output": 0.0}  # per minute, but we'll estimate per token
        }
        
        if model not in pricing:
            return 0.0
            
        rates = pricing[model]
        input_cost = (prompt_tokens / 1000) * rates["input"]
        output_cost = (completion_tokens / 1000) * rates["output"]
        
        return input_cost + output_cost
    
    def get_usage_stats(self, limit: int = 100) -> Dict[str, Any]:
        """Get usage statistics"""
        session = self.get_session()
        try:
            # Recent requests
            recent_requests = session.query(APIUsage).order_by(APIUsage.request_timestamp.desc()).limit(limit).all()
            
            # Total stats
            total_requests = session.query(APIUsage).count()
            total_cost = session.query(func.sum(APIUsage.estimated_cost_usd)).scalar() or 0.0
            total_tokens = session.query(func.sum(APIUsage.tokens_total)).scalar() or 0
            
            # Stats by service
            service_stats = session.execute(text("""
                SELECT service, 
                       COUNT(*) as request_count,
                       SUM(estimated_cost_usd) as total_cost,
                       SUM(tokens_total) as total_tokens,
                       AVG(response_time_ms) as avg_response_time
                FROM api_usage 
                GROUP BY service
                ORDER BY total_cost DESC
            """)).fetchall()
            
            # Recent errors
            recent_errors = session.query(APIUsage).filter(
                APIUsage.error_message.isnot(None)
            ).order_by(APIUsage.request_timestamp.desc()).limit(10).all()
            
            return {
                "total_requests": total_requests,
                "total_cost_usd": float(total_cost),
                "total_tokens": int(total_tokens),
                "recent_requests": [self._serialize_usage_record(r) for r in recent_requests],
                "service_stats": [dict(row._mapping) for row in service_stats],
                "recent_errors": [self._serialize_usage_record(r) for r in recent_errors]
            }
            
        finally:
            session.close()
    
    def _serialize_usage_record(self, record: APIUsage) -> Dict[str, Any]:
        """Convert usage record to dictionary"""
        return {
            "id": record.id,
            "service": record.service,
            "endpoint": record.endpoint,
            "method": record.method,
            "request_timestamp": record.request_timestamp.isoformat() if record.request_timestamp else None,
            "response_time_ms": record.response_time_ms,
            "model_used": record.model_used,
            "tokens_total": record.tokens_total,
            "estimated_cost_usd": float(record.estimated_cost_usd) if record.estimated_cost_usd else 0.0,
            "meeting_id": record.meeting_id,
            "status_code": record.status_code,
            "error_message": record.error_message
        }

# Global instance
usage_tracker = UsageTracker()