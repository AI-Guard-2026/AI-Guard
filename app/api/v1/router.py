# app/api/v1/router.py
# Registers all endpoint routers with their URL prefixes

from fastapi import APIRouter
from app.api.v1.endpoints import health, organisation, ai_system

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(organisation.router, prefix="/organisations", tags=["Organisations"])
api_router.include_router(ai_system.router, prefix="/organisations/{org_id}/ai-systems", tags=["AI Systems"])