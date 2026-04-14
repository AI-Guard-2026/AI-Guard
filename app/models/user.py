# app/models/user.py
# Users belong to one organisation
# RBAC: admin can do everything, editor can create/edit, viewer is read-only

from sqlalchemy import Column, String, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base, UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ADMIN = "admin"      # Full access — manage users, billing, all data
    EDITOR = "editor"    # Create and edit AI systems, run classifications
    VIEWER = "viewer"    # Read-only access to all data


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    # Identity (synced from Clerk after auth)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    clerk_user_id = Column(String(255), unique=True, nullable=True)  # Clerk's user ID

    # Multi-tenancy — every user belongs to one organisation
    organisation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Access control
    role = Column(
        Enum(UserRole),
        default=UserRole.VIEWER,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organisation = relationship("Organisation", back_populates="users")

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def can_edit(self) -> bool:
        return self.role in [UserRole.ADMIN, UserRole.EDITOR]