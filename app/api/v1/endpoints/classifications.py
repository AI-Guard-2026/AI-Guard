# app/api/v1/endpoints/classifications.py
# Classification endpoints
# POST to trigger classification
# GET to retrieve history

import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.classification import Classification
from app.schemas.classification import (
    ClassificationRequest,
    ClassificationResponse,
    ClassificationHistoryResponse,
)
from app.services import classification_service

router = APIRouter()


@router.post(
    "/{system_id}/classify",
    response_model=ClassificationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def classify_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    payload: ClassificationRequest = ClassificationRequest(),
    db: Session = Depends(get_db),
):
    """
    Classify an AI system under the EU AI Act.

    Flow:
    1. Rule engine checks obvious cases (instant, free)
    2. If uncertain — Claude API provides deeper analysis
    3. Result stored with full audit trail

    Returns risk tier, legal reasoning, and Annex III article reference.
    """
    return await classification_service.classify_ai_system(
        db=db,
        org_id=org_id,
        system_id=system_id,
        questionnaire_answers=payload.questionnaire_answers,
    )


@router.get(
    "/{system_id}/classifications",
    response_model=List[ClassificationHistoryResponse],
)
def get_classification_history(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Get full classification history for an AI system.
    Shows all classification attempts over time.
    Useful when regulation updates require re-classification.
    """
    history = (
        db.query(Classification)
        .filter(
            Classification.ai_system_id == system_id,
            Classification.organisation_id == org_id,
        )
        .order_by(Classification.created_at.desc())
        .all()
    )
    return history