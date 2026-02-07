from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings, Settings
from app.routers import ai, templates, campaigns

app = FastAPI(
    title="Bobotcho Backend",
    description="Backend API for Bobotcho WhatsApp Agent — RAG, Templates, Campaigns",
    version="1.0.0",
)

settings = get_settings()

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_api_key(request: Request):
    """Verify X-API-Key header for inter-service auth."""
    api_key = request.headers.get("X-API-Key")
    if api_key != settings.api_secret_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


app.include_router(ai.router, prefix="/api", dependencies=[Depends(verify_api_key)])
app.include_router(templates.router, prefix="/api", dependencies=[Depends(verify_api_key)])
app.include_router(campaigns.router, prefix="/api", dependencies=[Depends(verify_api_key)])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "bobotcho-backend", "version": "1.0.0"}
