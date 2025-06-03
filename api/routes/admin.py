from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from config import settings

router = APIRouter()

class AdminLoginRequest(BaseModel):
    password: str

@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """Authenticate admin user"""
    if request.password == settings.ADMIN_PASSWORD:
        return JSONResponse(content={
            "success": True,
            "message": "Authentication successful"
        })
    else:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin password"
        )

@router.get("/admin/check")
async def admin_check():
    """Health check for admin endpoints"""
    return JSONResponse(content={
        "status": "ready",
        "admin_configured": bool(settings.ADMIN_PASSWORD)
    })