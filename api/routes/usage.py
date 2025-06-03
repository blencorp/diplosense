from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from services.usage_tracker import usage_tracker
from typing import Optional

router = APIRouter()

@router.get("/usage/stats")
async def get_usage_stats(limit: Optional[int] = 100):
    """Get API usage statistics"""
    try:
        stats = usage_tracker.get_usage_stats(limit=limit)
        return JSONResponse(content=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/summary")
async def get_usage_summary():
    """Get usage summary for dashboard"""
    try:
        stats = usage_tracker.get_usage_stats(limit=10)
        
        # Calculate summary metrics
        summary = {
            "total_requests": stats["total_requests"],
            "total_cost_usd": stats["total_cost_usd"],
            "total_tokens": stats["total_tokens"],
            "services_used": len(stats["service_stats"]),
            "avg_cost_per_request": stats["total_cost_usd"] / max(1, stats["total_requests"]),
            "recent_errors_count": len(stats["recent_errors"])
        }
        
        return JSONResponse(content=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/export")
async def export_usage_data(limit: Optional[int] = 1000):
    """Export detailed usage data"""
    try:
        stats = usage_tracker.get_usage_stats(limit=limit)
        
        # Format for export
        export_data = {
            "generated_at": "2025-06-03T16:00:00Z",
            "summary": {
                "total_requests": stats["total_requests"],
                "total_cost_usd": stats["total_cost_usd"],
                "total_tokens": stats["total_tokens"]
            },
            "service_breakdown": stats["service_stats"],
            "detailed_requests": stats["recent_requests"]
        }
        
        return JSONResponse(content=export_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))