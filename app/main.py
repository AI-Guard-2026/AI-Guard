# app/main.py
# FastAPI application entry point
# Configures middleware, CORS, and registers all routes

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="EU AI Act Compliance Platform API",
    version="0.1.0",
    docs_url="/docs",       # Swagger UI at /docs
    redoc_url="/redoc",     # ReDoc at /redoc
)

origins = [
    "http://localhost:3000",                    # Local Next.js
    "http://localhost:3001",                    # Alternative port
    "https://tablet-royal-timid.ngrok-free.dev",# Your ngrok URL — update this
    "https://*.ngrok-free.app",                 # Allow all ngrok URLs
    "https://*.ngrok-free.dev",
]

if settings.APP_ENV == "development":
    origins = ["*"]  

# CORS — allow frontend to call API
# In production: replace "*" with your actual frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else ["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    """Root endpoint — confirms API is running."""
    return {
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "docs": "/docs",
    }