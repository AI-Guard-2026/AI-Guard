# app/models/audit_log.py
# Immutable, tamper-proof audit log
# Every action in the system is recorded here
# Hash chaining makes tampering detectable

import uuid
import hashlib
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class AuditLog(Base):
    """
    Append-only audit log with SHA256 hash chaining.
    
    Each record contains the hash of the previous record.
    If any record is tampered with, the chain breaks —
    making tampering instantly detectable.
    
    This is what makes AIGuard's compliance records court-admissible.
    """
    __tablename__ = "audit_logs"

    # Primary key — UUID
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # Timestamp — server-side, cannot be manipulated by application
    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Who did what
    organisation_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)

    # What happened
    action = Column(String(255), nullable=False, index=True)
    # Examples: "ai_system.created", "classification.completed", "document.generated"

    entity_type = Column(String(100), nullable=True)  # "ai_system", "classification", "document"
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Additional context stored as JSON
    details = Column(Text, nullable=True)  # JSON string

    # Hash chain — this is what makes the log tamper-proof
    previous_hash = Column(String(64), nullable=True)   # SHA256 of previous record
    record_hash = Column(String(64), nullable=False)    # SHA256 of this record

    @staticmethod
    def compute_hash(
        record_id: str,
        timestamp: str,
        organisation_id: str,
        user_id: str,
        action: str,
        entity_id: str,
        details: str,
        previous_hash: str,
    ) -> str:
        """
        Compute SHA256 hash of this record's content.
        If any field changes, the hash changes, breaking the chain.
        """
        content = json.dumps({
            "id": record_id,
            "timestamp": timestamp,
            "organisation_id": organisation_id,
            "user_id": user_id,
            "action": action,
            "entity_id": entity_id,
            "details": details,
            "previous_hash": previous_hash,
        }, sort_keys=True)

        return hashlib.sha256(content.encode()).hexdigest()

    def __repr__(self):
        return f"<AuditLog {self.action} at {self.timestamp}>"