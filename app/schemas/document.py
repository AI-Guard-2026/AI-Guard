# app/schemas/document.py

import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class DocumentGenerateRequest(BaseModel):
    """
    Body sent to trigger Annex IV document generation.
    interview_answers contains all responses to the questionnaire.
    """
    interview_answers: Dict[str, Any]


class DocumentResponse(BaseModel):
    """Returned after document is created or retrieved."""
    id: uuid.UUID
    ai_system_id: uuid.UUID
    organisation_id: uuid.UUID
    status: str
    version_number: int
    is_current_version: bool
    regulation_version: Optional[str]
    content: Optional[Dict[str, Any]]
    pdf_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentUpdateRequest(BaseModel):
    """Body for updating document content after user edits."""
    content: Dict[str, Any]


class DocumentListResponse(BaseModel):
    """List of document versions for one AI system."""
    items: list[DocumentResponse]
    total: int