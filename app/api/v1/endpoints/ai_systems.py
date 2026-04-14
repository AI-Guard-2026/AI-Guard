# app/api/v1/endpoints/ai_systems.py
# Thin endpoints — all logic in service layer

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ai_system import RiskTier, SystemStatus
from app.schemas.ai_system import (
    AISystemCreate,
    AISystemUpdate,
    AISystemResponse,
    AISystemListResponse,
    CSVImportResponse,
)
from app.services import ai_system_service

router = APIRouter()


@router.post(
    "/",
    response_model=AISystemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ai_system(
    org_id: uuid.UUID,
    payload: AISystemCreate,
    db: Session = Depends(get_db),
):
    """Add one AI system to inventory."""
    return ai_system_service.create_ai_system(db, org_id, payload)


@router.get("/", response_model=AISystemListResponse)
def list_ai_systems(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    risk_tier: Optional[RiskTier] = None,
    system_status: Optional[SystemStatus] = None,
    search: Optional[str] = None,
):
    """List all AI systems with optional filters."""
    return ai_system_service.list_ai_systems(
        db=db,
        org_id=org_id,
        page=page,
        size=size,
        risk_tier=risk_tier,
        system_status=system_status,
        search=search,
    )


@router.get("/{system_id}", response_model=AISystemResponse)
def get_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get one AI system by ID."""
    return ai_system_service.get_ai_system(db, org_id, system_id)


@router.patch("/{system_id}", response_model=AISystemResponse)
def update_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    payload: AISystemUpdate,
    db: Session = Depends(get_db),
):
    """Update AI system details."""
    return ai_system_service.update_ai_system(db, org_id, system_id, payload)


@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_system(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete an AI system."""
    ai_system_service.delete_ai_system(db, org_id, system_id)


@router.post("/import-csv", response_model=CSVImportResponse)
async def import_csv(
    org_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Bulk import AI systems from CSV.

    Download template below and fill it in:
    name, vendor, version, purpose, sector,
    deployment_date, is_in_eu_market,
    affected_persons, geographic_scope
    """
    content = await file.read()
    return ai_system_service.import_from_csv(db, org_id, content)


@router.get("/csv-template")
def download_csv_template():
    """
    Returns the CSV template headers so users know
    exactly what format to use for import.
    """
    return {
        "headers": [
            "name",
            "vendor",
            "version",
            "purpose",
            "sector",
            "deployment_date",
            "is_in_eu_market",
            "affected_persons",
            "geographic_scope",
        ],
        "required": ["name", "purpose"],
        "example_row": {
            "name": "Credit Scoring Model",
            "vendor": "Internal",
            "version": "2.1.0",
            "purpose": "Automated credit decisioning for loan applications",
            "sector": "fintech",
            "deployment_date": "2024-01-15",
            "is_in_eu_market": "true",
            "affected_persons": "Loan applicants",
            "geographic_scope": "Ireland, Germany",
        },
    }