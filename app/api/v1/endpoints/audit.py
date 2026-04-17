# app/api/v1/endpoints/audit.py
# Audit log endpoints
# Returns tamper-proof SHA256 chained log for an organisation

import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.services.audit_service import verify_audit_chain

router = APIRouter()


class AuditLogResponse(BaseModel):
    """Single audit log entry returned by API."""
    id: uuid.UUID
    timestamp: datetime
    action: str
    entity_type: Optional[str]
    entity_id: Optional[uuid.UUID]
    user_id: Optional[uuid.UUID]
    user_email: Optional[str]
    details: Optional[str]
    previous_hash: Optional[str]
    record_hash: str

    class Config:
        from_attributes = True


@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
)
def get_audit_logs(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = Query(default=None),
):
    """
    Get audit log for an organisation.

    Returns all actions recorded for this organisation
    in reverse chronological order (newest first).

    Each record contains:
    - timestamp: when the action happened
    - action: what happened (e.g. ai_system.created)
    - entity_type: what type of object was affected
    - entity_id: which specific object was affected
    - user_email: who did it
    - details: extra context as JSON string
    - record_hash: SHA256 hash of this record
    - previous_hash: SHA256 hash of previous record

    The hash chain proves no records have been tampered with.
    """
    query = db.query(AuditLog).filter(
        AuditLog.organisation_id == org_id
    )

    # Filter by action type if provided
    # e.g. ?action=classification.completed
    if action:
        query = query.filter(AuditLog.action == action)

    logs = (
        query
        .order_by(AuditLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return logs


@router.get("/audit-logs/verify")
def verify_chain(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Verify the audit log hash chain is intact.

    Called by compliance auditors to prove
    the audit log has never been tampered with.

    Returns:
    - valid: true if chain is intact
    - broken_at: record ID where chain breaks (if tampered)
    - total_records: how many records checked
    """
    return verify_audit_chain(db)