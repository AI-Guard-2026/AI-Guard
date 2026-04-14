# app/api/v1/endpoints/health.py
# Health check endpoints — used by AWS load balancer and monitoring

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()


@router.get("/")
def health_check():
    """Basic health check — is the API running."""
    return {"status": "healthy", "service": "AIGuard API"}


@router.get("/db")
def database_health(db: Session = Depends(get_db)):
    """Check database connection is working."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}