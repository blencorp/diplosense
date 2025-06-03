from fastapi import APIRouter
from fastapi.responses import JSONResponse
from services.simple_usage_tracker import simple_usage_tracker

router = APIRouter()

@router.get("/usage/stats")
async def get_usage_stats():
    """Get API usage statistics"""
    try:
        stats = simple_usage_tracker.get_stats(limit=100)
        return JSONResponse(content=stats)
    except Exception as e:
        return JSONResponse(content={
            "total_requests": 0,
            "total_cost_usd": 0.0,
            "total_tokens": 0,
            "recent_requests": [],
            "service_stats": [],
            "recent_errors": [],
            "error": str(e)
        })

@router.get("/usage/summary")
async def get_usage_summary():
    """Get usage summary for dashboard"""
    try:
        stats = simple_usage_tracker.get_stats(limit=10)
        
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
        return JSONResponse(content={
            "total_requests": 0,
            "total_cost_usd": 0.0,
            "total_tokens": 0,
            "services_used": 0,
            "avg_cost_per_request": 0.0,
            "recent_errors_count": 0,
            "error": str(e)
        })

@router.get("/usage/export")
async def export_usage_data():
    """Export detailed usage data"""
    try:
        stats = simple_usage_tracker.get_stats(limit=1000)
        
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
        return JSONResponse(content={"error": str(e)})