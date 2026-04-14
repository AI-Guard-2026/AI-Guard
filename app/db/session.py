# app/db/session.py
# Database connection and session management
# Sets tenant context for Row Level Security on every request

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Create engine
# pool_pre_ping checks connection is alive before using it
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,  # Log SQL in development
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def set_tenant_context(db: Session, tenant_id: str) -> None:
    """
    Set PostgreSQL session variable for Row Level Security.
    Called at the start of every authenticated request.
    RLS policies read this variable to filter rows automatically.
    """
    db.execute(
        text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
        {"tenant_id": str(tenant_id)},
    )


def get_db():
    """
    FastAPI dependency — yields a database session per request.
    Session is closed automatically when request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()