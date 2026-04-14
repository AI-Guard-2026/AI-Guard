# app/api/v1/endpoints/organisations.py
# CRUD endpoints for organisations

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organisation import Organisation
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate, OrganisationResponse
from app.services.audit_service import write_audit_log

router = APIRouter()


@router.post("/", response_model=OrganisationResponse, status_code=status.HTTP_201_CREATED)
def create_organisation(
    payload: OrganisationCreate,
    db: Session = Depends(get_db),
):
    """Create a new organisation (company account)."""

    # Check name not already taken
    existing = db.query(Organisation).filter(Organisation.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organisation with name '{payload.name}' already exists",
        )

    # Create organisation
    org = Organisation(**payload.model_dump())
    db.add(org)
    db.flush()  # Get the ID before commit

    # Write audit log
    write_audit_log(
        db=db,
        action="organisation.created",
        organisation_id=str(org.id),
        entity_type="organisation",
        entity_id=str(org.id),
        details={"name": org.name, "sector": org.sector},
    )

    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganisationResponse)
def get_organisation(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get organisation by ID."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return org


@router.patch("/{org_id}", response_model=OrganisationResponse)
def update_organisation(
    org_id: uuid.UUID,
    payload: OrganisationUpdate,
    db: Session = Depends(get_db),
):
    """Update organisation details."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    write_audit_log(
        db=db,
        action="organisation.updated",
        organisation_id=str(org.id),
        entity_type="organisation",
        entity_id=str(org.id),
        details=update_data,
    )

    db.commit()
    db.refresh(org)
    return org