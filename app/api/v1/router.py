# app/api/v1/router.py

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    organisations,
    ai_systems,
    classifications,
    documents,
)

api_router = APIRouter()

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"],
)
api_router.include_router(
    organisations.router,
    prefix="/organisations",
    tags=["Organisations"],
)
api_router.include_router(
    ai_systems.router,
    prefix="/organisations/{org_id}/ai-systems",
    tags=["AI Systems"],
)
api_router.include_router(
    classifications.router,
    prefix="/organisations/{org_id}/ai-systems",
    tags=["Classifications"],
)
api_router.include_router(
    documents.router,
    prefix="/organisations/{org_id}/ai-systems",
    tags=["Documents"],
)