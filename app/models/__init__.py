# app/models/__init__.py
# Import all models so Alembic can detect them for migrations

from app.models.organisation import Organisation
from app.models.user import User, UserRole
from app.models.ai_system import AISystem, RiskTier, SystemStatus
from app.models.classification import Classification
from app.models.document import AnnexIVDocument
from app.models.audit_log import AuditLog