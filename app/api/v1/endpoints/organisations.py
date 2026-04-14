# app/api/v1/endpoints/organisations.py
# Thin endpoints — all logic lives in service layer

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.organisation import (
    OrganisationCreate,
    OrganisationUpdate,
    OrganisationResponse,
)
from app.services import organisation_service

router = APIRouter()


@router.post(
    "/",
    response_model=OrganisationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organisation(
    payload: OrganisationCreate,
    db: Session = Depends(get_db),
):
    """Create a new organisation (company account)."""
    return organisation_service.create_organisation(db, payload)


@router.get("/{org_id}", response_model=OrganisationResponse)
def get_organisation(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get organisation by ID."""
    return organisation_service.get_organisation(db, org_id)


@router.patch("/{org_id}", response_model=OrganisationResponse)
def update_organisation(
    org_id: uuid.UUID,
    payload: OrganisationUpdate,
    db: Session = Depends(get_db),
):
    """Update organisation details."""
    return organisation_service.update_organisation(db, org_id, payload)