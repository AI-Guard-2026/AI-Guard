# app/models/document.py
# Annex IV technical documentation
# Required for every High Risk AI system before it can legally operate

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class AnnexIVDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "annex_iv_documents"

    # Which system this document covers
    ai_system_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_systems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organisation_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Interview answers used to generate this document
    interview_answers = Column(JSON, nullable=True)

    # Generated document content (stored as structured JSON sections)
    content = Column(JSON, nullable=True)

    # PDF storage
    pdf_s3_key = Column(String(500), nullable=True)  # S3 object key
    pdf_url = Column(String(1000), nullable=True)    # Pre-signed URL (temporary)

    # Status
    status = Column(String(50), default="draft", nullable=False)
    # draft → generating → review → approved

    # Version tracking
    version_number = Column(Integer, default=1, nullable=False)
    is_current_version = Column(Boolean, default=True, nullable=False)

    # Which regulation version this document was written for
    regulation_version = Column(String(100), nullable=True)
    claude_model_version = Column(String(100), nullable=True)

    # Relationships
    ai_system = relationship("AISystem", back_populates="documents")

    def __repr__(self):
        return f"<AnnexIVDocument v{self.version_number} [{self.status}]>"