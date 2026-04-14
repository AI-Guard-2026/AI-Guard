# app/schemas/classification.py

import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ClassificationRequest(BaseModel):
    """
    Optional questionnaire answers sent with classification request.
    Providing answers improves classification accuracy.
    """
    questionnaire_answers: Optional[dict] = None


class ClassificationResponse(BaseModel):
    """Returned after classification completes."""
    id: uuid.UUID
    ai_system_id: uuid.UUID
    risk_tier: str
    annex_iii_article: Optional[str]
    reasoning: str
    confidence_score: Optional[float]
    human_review_required: bool
    classification_method: str          # "rule_engine" or "claude_api"
    regulation_version: Optional[str]
    claude_model_version: Optional[str]

    class Config:
        from_attributes = True


class ClassificationHistoryResponse(BaseModel):
    """One entry in classification history."""
    id: uuid.UUID
    risk_tier: str
    annex_iii_article: Optional[str]
    confidence_score: Optional[float]
    classification_method: str
    regulation_version: Optional[str]
    human_review_required: bool
    created_at: datetime

    class Config:
        from_attributes = True