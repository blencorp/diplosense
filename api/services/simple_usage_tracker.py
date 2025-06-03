import time
import json
from typing import Dict, Any, List
from datetime import datetime
from collections import defaultdict

class SimpleUsageTracker:
    def __init__(self):
        self.requests: List[Dict[str, Any]] = []
        self.service_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "request_count": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "total_response_time": 0.0
        })
    
    def log_request(
        self,
        service: str,
        model: str,
        tokens: int,
        cost: float,
        response_time_ms: float,
        meeting_id: str = None,
        error: str = None
    ):
        """Log an API request"""
        request_data = {
            "id": len(self.requests) + 1,
            "service": service,
            "model": model,
            "tokens": tokens,
            "cost": cost,
            "response_time_ms": response_time_ms,
            "meeting_id": meeting_id,
            "timestamp": datetime.now().isoformat(),
            "error": error
        }
        
        self.requests.append(request_data)
        
        # Update service stats
        stats = self.service_stats[service]
        stats["request_count"] += 1
        stats["total_cost"] += cost
        stats["total_tokens"] += tokens
        stats["total_response_time"] += response_time_ms
        
        print(f"[USAGE] Logged {service} request: {tokens} tokens, ${cost:.4f}, {response_time_ms:.0f}ms")
    
    def get_stats(self, limit: int = 100) -> Dict[str, Any]:
        """Get usage statistics"""
        total_requests = len(self.requests)
        total_cost = sum(req["cost"] for req in self.requests)
        total_tokens = sum(req["tokens"] for req in self.requests)
        
        # Recent requests
        recent_requests = list(reversed(self.requests[-limit:]))
        
        # Service breakdown
        service_breakdown = []
        for service, stats in self.service_stats.items():
            avg_response_time = stats["total_response_time"] / max(1, stats["request_count"])
            service_breakdown.append({
                "service": service,
                "request_count": stats["request_count"],
                "total_cost": stats["total_cost"],
                "total_tokens": stats["total_tokens"],
                "avg_response_time": avg_response_time
            })
        
        # Recent errors
        recent_errors = [req for req in self.requests if req.get("error")][-10:]
        
        return {
            "total_requests": total_requests,
            "total_cost_usd": total_cost,
            "total_tokens": total_tokens,
            "recent_requests": recent_requests,
            "service_stats": service_breakdown,
            "recent_errors": recent_errors
        }
    
    def estimate_openai_cost(self, model: str, tokens: int) -> float:
        """Estimate OpenAI API cost"""
        # Simplified pricing (per 1K tokens)
        pricing = {
            "gpt-4o": 0.005,      # Average of input/output
            "whisper-1": 0.006    # Per minute, but estimated per token
        }
        
        rate = pricing.get(model, 0.005)
        return (tokens / 1000) * rate

# Global instance
simple_usage_tracker = SimpleUsageTracker()