# app/services/organisation_service.py
# Business logic for organisations
# Keeps endpoints clean — all DB operations live here

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.organisation import Organisation
from app.schemas.organisation import OrganisationCreate, OrganisationUpdate
from app.services.audit_service import write_audit_log


def create_organisation(
    db: Session,
    payload: OrganisationCreate,
) -> Organisation:
    """Create a new organisation. Raises 409 if name already taken."""

    # Check name not already taken
    existing = db.query(Organisation).filter(
        Organisation.name == payload.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organisation '{payload.name}' already exists",
        )

    org = Organisation(**payload.model_dump())
    db.add(org)
    db.flush()

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


def get_organisation(
    db: Session,
    org_id: uuid.UUID,
) -> Organisation:
    """Get organisation by ID. Raises 404 if not found."""

    org = db.query(Organisation).filter(
        Organisation.id == org_id
    ).first()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found",
        )
    return org


def update_organisation(
    db: Session,
    org_id: uuid.UUID,
    payload: OrganisationUpdate,
) -> Organisation:
    """Update organisation fields. Only updates provided fields."""

    org = get_organisation(db, org_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    write_audit_log(
        db=db,
        action="organisation.updated",
        organisation_id=str(org_id),
        entity_type="organisation",
        entity_id=str(org_id),
        details=update_data,
    )

    db.commit()
    db.refresh(org)
    return org