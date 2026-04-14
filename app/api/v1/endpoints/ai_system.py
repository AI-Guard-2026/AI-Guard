# app/api/v1/endpoints/ai_systems.py
# CRUD endpoints for AI systems + CSV import

import uuid
import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.ai_system import AISystem, RiskTier, SystemStatus
from app.models.organisation import Organisation
from app.schemas.ai_system import (
    AISystemCreate,
    AISystemUpdate,
    AISystemResponse,
    AISystemListResponse,
    CSVImportResponse,
)
from app.services.audit_service import write_audit_log

router = APIRouter()


@router.post("/", response_model=AISystemResponse, status_code=status.HTTP_201_CREATED)
def create_ai_system(
    org_id: uuid.UUID,
    payload: AISystemCreate,
    db: Session = Depends(get_db),
):
    """Add one AI system to an organisation's inventory."""

    # Verify organisation exists
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    # Create system
    system = AISystem(
        organisation_id=org_id,
        **payload.model_dump(),
    )
    db.add(system)
    db.flush()

    write_audit_log(
        db=db,
        action="ai_system.created",
        organisation_id=str(org_id),
        entity_type="ai_system",
        entity_id=str(system.id),
        details={"name": system.name, "purpose": system.purpose},
    )

    db.commit()
    db.refresh(system)
    return system


@router.get("/", response_model=AISystemListResponse)
def list_ai_systems(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    risk_tier: Optional[RiskTier] = None,
    status: Optional[SystemStatus] = None,
    search: Optional[str] = None,
):
    """List all AI systems for an organisation with optional filters."""

    query = db.query(AISystem).filter(AISystem.organisation_id == org_id)

    # Apply filters
    if risk_tier:
        query = query.filter(AISystem.risk_tier == risk_tier)
    if status:
        query = query.filter(AISystem.status == status)
    if search:
        query = query.filter(
            AISystem.name.ilike(f"%{search}%") |
            AISystem.purpose.ilike(f"%{search}%")
        )

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return AISystemListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
    )


@router.get("/{system_id}", response_model=AISystemResponse)
def get_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get one AI system by ID."""
    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(status_code=404, detail="AI system not found")
    return system


@router.patch("/{system_id}", response_model=AISystemResponse)
def update_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    payload: AISystemUpdate,
    db: Session = Depends(get_db),
):
    """Update an AI system's details."""
    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(status_code=404, detail="AI system not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(system, field, value)

    write_audit_log(
        db=db,
        action="ai_system.updated",
        organisation_id=str(org_id),
        entity_type="ai_system",
        entity_id=str(system_id),
        details=update_data,
    )

    db.commit()
    db.refresh(system)
    return system


@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete an AI system."""
    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(status_code=404, detail="AI system not found")

    write_audit_log(
        db=db,
        action="ai_system.deleted",
        organisation_id=str(org_id),
        entity_type="ai_system",
        entity_id=str(system_id),
        details={"name": system.name},
    )

    db.delete(system)
    db.commit()


@router.post("/import-csv", response_model=CSVImportResponse)
async def import_csv(
    org_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Import multiple AI systems from a CSV file.

    Expected CSV columns:
    name, vendor, version, purpose, sector,
    deployment_date, is_in_eu_market, affected_persons, geographic_scope
    """

    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    # Read file content
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    failed = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
        try:
            # Validate required fields
            if not row.get("name") or not row.get("purpose"):
                errors.append(f"Row {row_num}: 'name' and 'purpose' are required")
                failed += 1
                continue

            # Parse boolean
            is_eu = str(row.get("is_in_eu_market", "true")).lower() in ["true", "yes", "1"]

            system = AISystem(
                organisation_id=org_id,
                name=row["name"].strip(),
                vendor=row.get("vendor", "").strip() or None,
                version=row.get("version", "").strip() or None,
                purpose=row["purpose"].strip(),
                sector=row.get("sector", "").strip() or None,
                deployment_date=row.get("deployment_date", "").strip() or None,
                is_in_eu_market=is_eu,
                affected_persons=row.get("affected_persons", "").strip() or None,
                geographic_scope=row.get("geographic_scope", "").strip() or None,
            )

            db.add(system)
            db.flush()
            created += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            failed += 1
            db.rollback()

    if created > 0:
        write_audit_log(
            db=db,
            action="ai_system.csv_imported",
            organisation_id=str(org_id),
            details={"created": created, "failed": failed},
        )
        db.commit()

    return CSVImportResponse(created=created, failed=failed, errors=errors)