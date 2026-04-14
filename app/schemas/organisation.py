# app/schemas/organisation.py
# Pydantic schemas for request/response validation
# These are what the API accepts and returns — not the database models

import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class OrganisationCreate(BaseModel):
    """Body for POST /organisations"""
    name: str
    sector: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class OrganisationUpdate(BaseModel):
    """Body for PATCH /organisations/{id}"""
    name: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class OrganisationResponse(BaseModel):
    """Returned by API for organisation data"""
    id: uuid.UUID
    name: str
    sector: Optional[str]
    country: Optional[str]
    website: Optional[str]
    plan: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows creating from SQLAlchemy model