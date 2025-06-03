from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(50), nullable=False)  # 'openai_vision', 'openai_whisper', etc.
    endpoint = Column(String(200), nullable=False)  # API endpoint called
    method = Column(String(10), nullable=False)  # HTTP method
    
    # Request details
    request_payload = Column(JSON)  # Store request data (sanitized)
    request_size_bytes = Column(Integer)
    
    # Response details
    response_data = Column(JSON)  # Store response data
    response_size_bytes = Column(Integer)
    status_code = Column(Integer)
    
    # Timing and costs
    request_timestamp = Column(DateTime, server_default=func.now())
    response_time_ms = Column(Float)  # Response time in milliseconds
    
    # OpenAI specific fields
    model_used = Column(String(50))  # 'gpt-4o', 'whisper-1', etc.
    tokens_prompt = Column(Integer)
    tokens_completion = Column(Integer)
    tokens_total = Column(Integer)
    estimated_cost_usd = Column(Float)
    
    # Context
    meeting_id = Column(String(100))
    session_id = Column(String(100))
    user_agent = Column(String(500))
    
    # Error tracking
    error_message = Column(Text)
    error_type = Column(String(100))