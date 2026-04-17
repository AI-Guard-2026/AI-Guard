# app/api/v1/endpoints/stats.py
# Dashboard statistics endpoint
# Returns all numbers needed for the dashboard in one call

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.models.ai_system import AISystem, RiskTier, SystemStatus
from app.models.classification import Classification
from app.models.document import AnnexIVDocument
from app.models.organisation import Organisation

router = APIRouter()


class DashboardStats(BaseModel):
    """All stats needed for the dashboard in one response."""

    # Organisation info
    organisation_name: str
    plan: str

    # AI System counts
    total_systems: int
    unclassified: int
    high_risk: int
    limited_risk: int
    minimal_risk: int
    unacceptable: int

    # Compliance progress
    compliant: int
    needs_review: int
    in_progress: int

    # Document stats
    total_documents: int
    approved_documents: int
    pending_documents: int

    # Compliance score 0-100
    compliance_score: int

    # Deadline info
    days_until_deadline: int
    on_track: bool


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Get all dashboard statistics for an organisation.
    Returns everything needed to render the dashboard in one call.

    Compliance score calculated as:
    - 25 points: all systems classified
    - 25 points: no unacceptable risk systems
    - 25 points: all high risk systems have documents
    - 25 points: all documents approved
    Total: 100 points
    """

    # Load organisation
    org = db.query(Organisation).filter(
        Organisation.id == org_id
    ).first()

    org_name = str(org.name) if org else "Unknown"
    org_plan = str(org.plan) if org else "starter"

    # ── AI System counts ──────────────────────────────────────
    total_systems = db.query(AISystem).filter(
        AISystem.organisation_id == org_id
    ).count()

    unclassified = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.risk_tier == RiskTier.UNCLASSIFIED,
    ).count()

    high_risk = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.risk_tier == RiskTier.HIGH,
    ).count()

    limited_risk = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.risk_tier == RiskTier.LIMITED,
    ).count()

    minimal_risk = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.risk_tier == RiskTier.MINIMAL,
    ).count()

    unacceptable = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.risk_tier == RiskTier.UNACCEPTABLE,
    ).count()

    # ── Status counts ─────────────────────────────────────────
    compliant = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.status == SystemStatus.COMPLIANT,
    ).count()

    needs_review = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.status == SystemStatus.NEEDS_REVIEW,
    ).count()

    in_progress = db.query(AISystem).filter(
        AISystem.organisation_id == org_id,
        AISystem.status.in_([
            SystemStatus.CLASSIFICATION_IN_PROGRESS,
            SystemStatus.DOCUMENTATION_IN_PROGRESS,
        ]),
    ).count()

    # ── Document counts ───────────────────────────────────────
    total_documents = db.query(AnnexIVDocument).filter(
        AnnexIVDocument.organisation_id == org_id,
        AnnexIVDocument.is_current_version == True,
    ).count()

    approved_documents = db.query(AnnexIVDocument).filter(
        AnnexIVDocument.organisation_id == org_id,
        AnnexIVDocument.is_current_version == True,
        AnnexIVDocument.status == "approved",
    ).count()

    pending_documents = total_documents - approved_documents

    # ── Compliance Score ──────────────────────────────────────
    score = 0

    # 25 points — all systems classified
    if total_systems > 0:
        classified = total_systems - unclassified
        score += int((classified / total_systems) * 25)

    # 25 points — no unacceptable risk systems
    if unacceptable == 0:
        score += 25

    # 25 points — all high risk systems have documents
    if high_risk > 0:
        score += int((total_documents / high_risk) * 25)
    elif high_risk == 0:
        score += 25  # No high risk systems = full points

    # 25 points — all documents approved
    if total_documents > 0:
        score += int((approved_documents / total_documents) * 25)
    elif total_documents == 0 and high_risk == 0:
        score += 25  # No docs needed = full points

    # Cap at 100
    score = min(score, 100)

    # ── Deadline calculation ───────────────────────────────────
    from datetime import date
    deadline = date(2026, 8, 2)  # EU AI Act enforcement date
    today = date.today()
    days_until_deadline = (deadline - today).days

    # On track if score >= 50 and deadline > 30 days away
    on_track = score >= 50 and days_until_deadline > 30

    return DashboardStats(
        organisation_name=org_name,
        plan=org_plan,
        total_systems=total_systems,
        unclassified=unclassified,
        high_risk=high_risk,
        limited_risk=limited_risk,
        minimal_risk=minimal_risk,
        unacceptable=unacceptable,
        compliant=compliant,
        needs_review=needs_review,
        in_progress=in_progress,
        total_documents=total_documents,
        approved_documents=approved_documents,
        pending_documents=pending_documents,
        compliance_score=score,
        days_until_deadline=days_until_deadline,
        on_track=on_track,
    )