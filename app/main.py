# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="EU AI Act Compliance Platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend to call backend
origins = [
    # Local development
    "http://localhost:3000",
    "http://localhost:3001",
    # Vercel deployments
    "https://aiguardd-8ek0pkzmp-aiguard2026-1088s-projects.vercel.app",
    "https://aiguard.vercel.app",
    # Allow all Vercel preview deployments
    "https://*.vercel.app",
    # ngrok for local testing
    "https://*.ngrok-free.app",
    "https://*.ngrok-free.dev",
]

# In development allow everything
if settings.APP_ENV == "development":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "status": "running",
        "environment": settings.APP_ENV,
    }