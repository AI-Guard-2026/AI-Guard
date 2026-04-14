# app/models/ai_system.py
# Core entity — represents one AI system a company is tracking
# Every AI system goes through: Inventory → Classify → Document → Monitor

from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class RiskTier(str, enum.Enum):
    UNCLASSIFIED = "unclassified"
    UNACCEPTABLE = "unacceptable"   # Banned — must be shut down
    HIGH = "high"                   # Requires Annex IV documentation
    LIMITED = "limited"             # Transparency obligations only
    MINIMAL = "minimal"             # No obligations


class SystemStatus(str, enum.Enum):
    DRAFT = "draft"                         # Just added, incomplete info
    AWAITING_CLASSIFICATION = "awaiting"    # Ready to classify
    CLASSIFICATION_IN_PROGRESS = "classifying"
    CLASSIFIED = "classified"               # Classification complete
    DOCUMENTATION_IN_PROGRESS = "documenting"
    COMPLIANT = "compliant"                 # All requirements met
    NEEDS_REVIEW = "needs_review"           # Human review flagged


class AISystem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_systems"

    # Multi-tenancy — every system belongs to one organisation
    organisation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic information
    name = Column(String(255), nullable=False)
    vendor = Column(String(255), nullable=True)         # Who built it (OpenAI, internal, etc)
    version = Column(String(100), nullable=True)
    purpose = Column(Text, nullable=False)              # What does this AI do
    description = Column(Text, nullable=True)

    # Deployment details
    sector = Column(String(100), nullable=True)         # Which sector it operates in
    deployment_date = Column(String(50), nullable=True) # When deployed to production
    is_in_eu_market = Column(Boolean, default=True)     # Is it used in EU
    affected_persons = Column(Text, nullable=True)      # Who does it affect (employees, customers)
    geographic_scope = Column(String(255), nullable=True) # Which countries

    # Classification result
    risk_tier = Column(
        Enum(RiskTier),
        default=RiskTier.UNCLASSIFIED,
        nullable=False,
        index=True,
    )
    annex_iii_article = Column(String(100), nullable=True)  # e.g. "Annex III, Point 5(b)"
    classification_reasoning = Column(Text, nullable=True)
    regulation_version = Column(String(100), nullable=True)  # Which version of AI Act applied
    human_review_required = Column(Boolean, default=False)

    # Status
    status = Column(
        Enum(SystemStatus),
        default=SystemStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Relationships
    organisation = relationship("Organisation", back_populates="ai_systems")
    classifications = relationship("Classification", back_populates="ai_system", cascade="all, delete-orphan")
    documents = relationship("AnnexIVDocument", back_populates="ai_system", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AISystem {self.name} [{self.risk_tier}]>"