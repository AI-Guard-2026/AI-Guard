# app/schemas/user.py

import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    """Body for POST /users/register"""
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.VIEWER
    clerk_user_id: Optional[str] = None
    # Optional — if provided, user joins this org
    # If not provided, a new org is created
    organisation_id: Optional[uuid.UUID] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    organisation_id: uuid.UUID
    clerk_user_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True