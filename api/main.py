from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from routes.analysis import router as analysis_router
from routes.simple_usage import router as usage_router
from routes.admin import router as admin_router
from config import settings

app = FastAPI(title="DiploSense API", description="Diplomatic Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis_router, prefix="/api/v1", tags=["analysis"])
app.include_router(usage_router, prefix="/api/v1", tags=["usage"])
app.include_router(admin_router, prefix="/api/v1", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "DiploSense API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "diplosense-api"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)