# app/models/classification.py
# Stores every classification attempt with full audit trail
# One AI system can have multiple classifications over time (regulation updates)

from sqlalchemy import Column, String, Text, Boolean, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class Classification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "classifications"

    # Which system this classification is for
    ai_system_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_systems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Which user triggered this classification
    triggered_by_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Multi-tenancy
    organisation_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Questionnaire answers stored as JSON
    questionnaire_answers = Column(JSON, nullable=True)

    # Classification result
    risk_tier = Column(String(50), nullable=False)
    annex_iii_article = Column(String(100), nullable=True)
    reasoning = Column(Text, nullable=True)         # Full written reasoning from Claude
    confidence_score = Column(Float, nullable=True) # 0.0 to 1.0
    human_review_required = Column(Boolean, default=False)

    # How was this classification determined
    classification_method = Column(String(50), nullable=False)  # "rule_engine" or "claude_api"

    # Regulatory context — critical for audit trail
    regulation_version = Column(String(100), nullable=True)  # "EU AI Act 2024/1689"
    claude_model_version = Column(String(100), nullable=True) # Which Claude model was used

    # Relationships
    ai_system = relationship("AISystem", back_populates="classifications")

    def __repr__(self):
        return f"<Classification {self.risk_tier} [{self.confidence_score}]>"