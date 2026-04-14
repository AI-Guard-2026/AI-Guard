# app/api/v1/endpoints/users.py
# User registration and management endpoints

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.organisation import Organisation
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.audit_service import write_audit_log

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user after Clerk signup.
    Call this immediately after user signs up on frontend.
    Automatically creates an organisation for the first user.
    """

    # Check email not already registered
    existing = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Auto create organisation for this user
    org = Organisation(
        name=f"{payload.full_name or payload.email}'s Organisation",
        is_active=True,
        plan="starter",
    )
    db.add(org)
    db.flush()

    # Create user as admin of their org
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        clerk_user_id=payload.clerk_user_id,
        organisation_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.flush()

    write_audit_log(
        db=db,
        action="user.registered",
        organisation_id=str(org.id),
        user_id=str(user.id),
        user_email=str(user.email),
        entity_type="user",
        entity_id=str(user.id),
        details={
            "email": user.email,
            "org_id": str(org.id),
        },
    )

    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def get_me(
    db: Session = Depends(get_db),
):
    """
    Get current user profile.
    TODO: Add Clerk auth dependency once keys are configured.
    For now returns first user for testing.
    """
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found",
        )
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("role", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/organisations/{org_id}/users",
    response_model=List[UserResponse],
)
def list_org_users(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """List all users in an organisation."""
    users = db.query(User).filter(
        User.organisation_id == org_id
    ).all()
    return users


@router.post(
    "/organisations/{org_id}/users/invite",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_user(
    org_id: uuid.UUID,
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    """Invite a new user to an organisation."""

    existing = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        organisation_id=org_id,
        role=payload.role or UserRole.VIEWER,
        is_active=True,
    )

    db.add(new_user)
    db.flush()

    write_audit_log(
        db=db,
        action="user.invited",
        organisation_id=str(org_id),
        user_id=str(new_user.id),
        user_email=str(new_user.email),
        entity_type="user",
        entity_id=str(new_user.id),
        details={"email": new_user.email},
    )

    db.commit()
    db.refresh(new_user)
    return new_user