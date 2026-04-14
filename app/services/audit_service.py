# app/services/audit_service.py
# Service for writing tamper-proof audit log entries
# Every significant action in AIGuard calls this

import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.audit_log import AuditLog


def get_latest_hash(db: Session) -> Optional[str]:
    """Get the hash of the most recent audit log entry."""
    result = db.execute(
        text("SELECT record_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1")
    ).fetchone()
    return result[0] if result else None


def write_audit_log(
    db: Session,
    action: str,
    organisation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
) -> AuditLog:
    """
    Write one immutable audit log entry.
    
    Automatically:
    - Gets the previous record's hash
    - Computes this record's hash (including previous hash)
    - Stores both — creating the chain
    
    Usage:
        write_audit_log(
            db=db,
            action="ai_system.created",
            organisation_id=str(org.id),
            user_id=str(user.id),
            entity_type="ai_system",
            entity_id=str(system.id),
            details={"name": "Credit Scoring Model"}
        )
    """
    record_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    details_str = json.dumps(details) if details else "{}"
    previous_hash = get_latest_hash(db) or "GENESIS"  # First record has no previous

    # Compute hash of this record's content
    record_hash = AuditLog.compute_hash(
        record_id=record_id,
        timestamp=timestamp,
        organisation_id=str(organisation_id) if organisation_id else "",
        user_id=str(user_id) if user_id else "",
        action=action,
        entity_id=str(entity_id) if entity_id else "",
        details=details_str,
        previous_hash=previous_hash,
    )

    # Create audit log entry
    log_entry = AuditLog(
        id=uuid.UUID(record_id),
        organisation_id=uuid.UUID(str(organisation_id)) if organisation_id else None,
        user_id=uuid.UUID(str(user_id)) if user_id else None,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=uuid.UUID(str(entity_id)) if entity_id else None,
        details=details_str,
        previous_hash=previous_hash,
        record_hash=record_hash,
    )

    db.add(log_entry)
    db.flush()  # Write to DB immediately without committing full transaction

    return log_entry


def verify_audit_chain(db: Session) -> dict:
    """
    Verify the entire audit log chain is intact.
    Returns: {"valid": True} or {"valid": False, "broken_at": record_id}
    
    Call this during compliance audits to prove log integrity.
    """
    records = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()

    previous_hash = "GENESIS"

    for record in records:
        # Recompute hash for this record
        expected_hash = AuditLog.compute_hash(
            record_id=str(record.id),
            timestamp=record.timestamp.isoformat(),
            organisation_id=str(record.organisation_id) if record.organisation_id else "",
            user_id=str(record.user_id) if record.user_id else "",
            action=record.action,
            entity_id=str(record.entity_id) if record.entity_id else "",
            details=record.details or "{}",
            previous_hash=previous_hash,
        )

        if record.record_hash != expected_hash:
            # Chain is broken — tampering detected
            return {
                "valid": False,
                "broken_at": str(record.id),
                "timestamp": record.timestamp.isoformat(),
                "action": record.action,
            }

        previous_hash = record.record_hash

    return {"valid": True, "total_records": len(records)}