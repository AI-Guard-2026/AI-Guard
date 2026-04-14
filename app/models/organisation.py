# app/models/organisation.py
# Organisation = one company using AIGuard
# All data in the system belongs to an organisation (tenant)

from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class Organisation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organisations"

    # Company details
    name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True)   # fintech, healthcare, manufacturing
    country = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # Subscription
    plan = Column(String(50), default="starter", nullable=False)  # starter, professional, scale
    is_active = Column(Boolean, default=True, nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)

    # Relationships
    users = relationship("User", back_populates="organisation", cascade="all, delete-orphan")
    ai_systems = relationship("AISystem", back_populates="organisation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organisation {self.name}>"