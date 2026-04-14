# app/schemas/ai_system.py

import uuid
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.ai_system import RiskTier, SystemStatus


class AISystemCreate(BaseModel):
    """Body for POST /ai-systems"""
    name: str
    vendor: Optional[str] = None
    version: Optional[str] = None
    purpose: str
    description: Optional[str] = None
    sector: Optional[str] = None
    deployment_date: Optional[str] = None
    is_in_eu_market: bool = True
    affected_persons: Optional[str] = None
    geographic_scope: Optional[str] = None


class AISystemUpdate(BaseModel):
    """Body for PATCH /ai-systems/{id}"""
    name: Optional[str] = None
    vendor: Optional[str] = None
    version: Optional[str] = None
    purpose: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    deployment_date: Optional[str] = None
    is_in_eu_market: Optional[bool] = None
    affected_persons: Optional[str] = None
    geographic_scope: Optional[str] = None


class AISystemResponse(BaseModel):
    id: uuid.UUID
    name: str
    vendor: Optional[str]
    version: Optional[str]
    purpose: str
    sector: Optional[str]
    risk_tier: RiskTier
    status: SystemStatus
    annex_iii_article: Optional[str]
    human_review_required: bool
    organisation_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AISystemListResponse(BaseModel):
    """Paginated list of AI systems"""
    items: List[AISystemResponse]
    total: int
    page: int
    size: int


class CSVImportResponse(BaseModel):
    """Returned after CSV import"""
    created: int
    failed: int
    errors: List[str]