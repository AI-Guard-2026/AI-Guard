# app/services/ai_system_service.py
# All business logic for AI system inventory
# Create, read, update, delete, CSV import

# app/services/ai_system_service.py

import uuid
import csv
import io
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.ai_system import AISystem, RiskTier, SystemStatus
from app.models.organisation import Organisation
from app.schemas.ai_system import (
    AISystemCreate,
    AISystemUpdate,
    AISystemResponse,        # added
    AISystemListResponse,
    CSVImportResponse,
)
from app.services.audit_service import write_audit_log


def get_organisation_or_404(db: Session, org_id: uuid.UUID) -> Organisation:
    """Verify organisation exists before any operation."""
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found",
        )
    return org


def create_ai_system(
    db: Session,
    org_id: uuid.UUID,
    payload: AISystemCreate,
    user_id: Optional[uuid.UUID] = None,
) -> AISystem:
    """
    Add one AI system to organisation inventory.
    Status starts as DRAFT — ready for classification.
    """

    # Verify org exists
    get_organisation_or_404(db, org_id)

    system = AISystem(
        organisation_id=org_id,
        status=SystemStatus.DRAFT,
        risk_tier=RiskTier.UNCLASSIFIED,
        **payload.model_dump(),
    )

    db.add(system)
    db.flush()

    write_audit_log(
        db=db,
        action="ai_system.created",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="ai_system",
        entity_id=str(system.id),
        details={
            "name": system.name,
            "vendor": system.vendor,
            "purpose": system.purpose,
            "sector": system.sector,
        },
    )

    db.commit()
    db.refresh(system)
    return system


def get_ai_system(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
) -> AISystem:
    """Get one AI system. Raises 404 if not found or wrong org."""

    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found",
        )
    return system


def list_ai_systems(
    db: Session,
    org_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
    risk_tier: Optional[RiskTier] = None,
    system_status: Optional[SystemStatus] = None,
    search: Optional[str] = None,
) -> AISystemListResponse:
    """
    List all AI systems for an organisation.
    Supports filtering by risk tier, status, and search term.
    """

    query = db.query(AISystem).filter(
        AISystem.organisation_id == org_id
    )

    # Apply filters if provided
    if risk_tier:
        query = query.filter(AISystem.risk_tier == risk_tier)

    if system_status:
        query = query.filter(AISystem.status == system_status)

    if search:
        # Search across name, purpose, and vendor
        search_term = f"%{search}%"
        query = query.filter(
            AISystem.name.ilike(search_term) |
            AISystem.purpose.ilike(search_term) |
            AISystem.vendor.ilike(search_term)
        )

    # Get total count before pagination
    total = query.count()

# Apply pagination
    db_items: List[AISystem] = (
        query
        .order_by(AISystem.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # Convert SQLAlchemy models to Pydantic schemas
    # from_attributes=True in schema config handles this conversion
    response_items = [AISystemResponse.model_validate(item) for item in db_items]

    return AISystemListResponse(
        items=response_items,
        total=total,
        page=page,
        size=size,
    )

def update_ai_system(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    payload: AISystemUpdate,
    user_id: Optional[uuid.UUID] = None,
) -> AISystem:
    """Update AI system fields. Only updates provided fields."""

    system = get_ai_system(db, org_id, system_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(system, field, value)

    write_audit_log(
        db=db,
        action="ai_system.updated",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="ai_system",
        entity_id=str(system_id),
        details=update_data,
    )

    db.commit()
    db.refresh(system)
    return system


def delete_ai_system(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> None:
    """Delete an AI system permanently."""

    system = get_ai_system(db, org_id, system_id)

    write_audit_log(
        db=db,
        action="ai_system.deleted",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="ai_system",
        entity_id=str(system_id),
        details={"name": system.name},
    )

    db.delete(system)
    db.commit()


def import_from_csv(
    db: Session,
    org_id: uuid.UUID,
    file_content: bytes,
    user_id: Optional[uuid.UUID] = None,
) -> CSVImportResponse:
    """
    Bulk import AI systems from CSV file.

    Expected CSV headers:
    name, vendor, version, purpose, sector,
    deployment_date, is_in_eu_market,
    affected_persons, geographic_scope

    Only name and purpose are required.
    All other fields are optional.
    """

    # Verify org exists
    get_organisation_or_404(db, org_id)

    # Decode file content
    try:
        text = file_content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be UTF-8 encoded",
        )

    reader = csv.DictReader(io.StringIO(text))

    # Validate CSV has required columns
    required_columns = {"name", "purpose"}
    if reader.fieldnames:
        missing = required_columns - set(reader.fieldnames)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV missing required columns: {missing}",
            )

    created = 0
    failed = 0
    errors = []
    created_ids = []

    for row_num, row in enumerate(reader, start=2):
        try:
            # Validate required fields
            name = row.get("name", "").strip()
            purpose = row.get("purpose", "").strip()

            if not name:
                errors.append(f"Row {row_num}: 'name' is required")
                failed += 1
                continue

            if not purpose:
                errors.append(f"Row {row_num}: 'purpose' is required")
                failed += 1
                continue

            # Parse boolean for is_in_eu_market
            eu_raw = str(row.get("is_in_eu_market", "true")).lower().strip()
            is_eu = eu_raw in ["true", "yes", "1", "y"]

            # Create system
            system = AISystem(
                organisation_id=org_id,
                name=name,
                vendor=row.get("vendor", "").strip() or None,
                version=row.get("version", "").strip() or None,
                purpose=purpose,
                sector=row.get("sector", "").strip() or None,
                deployment_date=row.get("deployment_date", "").strip() or None,
                is_in_eu_market=is_eu,
                affected_persons=row.get("affected_persons", "").strip() or None,
                geographic_scope=row.get("geographic_scope", "").strip() or None,
                status=SystemStatus.DRAFT,
                risk_tier=RiskTier.UNCLASSIFIED,
            )

            db.add(system)
            db.flush()
            created_ids.append(str(system.id))
            created += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            failed += 1
            db.rollback()

    # Write single audit log for entire import
    if created > 0:
        write_audit_log(
            db=db,
            action="ai_system.csv_imported",
            organisation_id=str(org_id),
            user_id=str(user_id) if user_id else None,
            details={
                "created": created,
                "failed": failed,
                "system_ids": created_ids,
            },
        )
        db.commit()

    return CSVImportResponse(
        created=created,
        failed=failed,
        errors=errors,
    )