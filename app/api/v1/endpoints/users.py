# app/api/v1/endpoints/users.py
# User registration and management endpoints
# Simple version — no JWT auth required

import uuid
from typing import List, Optional
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
    status_code=status.HTTP_200_OK,
)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user after Clerk signup.

    If organisation_id provided → join that organisation
    If organisation_id not provided → create new organisation

    If user already exists → return existing user.
    """

    # Check 1 — already registered with this Clerk ID
    if payload.clerk_user_id:
        existing = db.query(User).filter(
            User.clerk_user_id == payload.clerk_user_id
        ).first()
        if existing:
            return existing

    # Check 2 — registered with same email
    existing_by_email = db.query(User).filter(
        User.email == payload.email
    ).first()

    if existing_by_email:
        if payload.clerk_user_id:
            existing_by_email.clerk_user_id = payload.clerk_user_id  # type: ignore
            db.commit()
            db.refresh(existing_by_email)
        return existing_by_email

    # Check 3 — new user
    # If organisation_id provided — join that org
    # If not — create a new org
    if payload.organisation_id:
        org_id = payload.organisation_id
        role = payload.role or UserRole.VIEWER
    else:
        # Create new organisation for this user
        org = Organisation(
            name=f"{payload.full_name or payload.email}'s Organisation",
            is_active=True,
            plan="starter",
        )
        db.add(org)
        db.flush()
        org_id = org.id
        role = UserRole.ADMIN  # First user is always admin

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        clerk_user_id=payload.clerk_user_id,
        organisation_id=org_id,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    write_audit_log(
        db=db,
        action="user.registered",
        organisation_id=str(org_id),
        user_id=str(user.id),
        user_email=str(user.email),
        entity_type="user",
        entity_id=str(user.id),
        details={
            "email": user.email,
            "org_id": str(org_id),
        },
    )

    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def get_me(
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """
    Get user profile by Clerk user ID.
    Frontend passes clerk_user_id as query param.

    Usage:
    GET /api/v1/users/me?clerk_user_id=user_abc123
    """
    user = db.query(User).filter(
        User.clerk_user_id == clerk_user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first at POST /api/v1/users/register",
        )
    return user


@router.get("/find", response_model=UserResponse)
def find_user_by_email(
    email: str,
    db: Session = Depends(get_db),
):
    """Find user by email — for debugging."""
    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found",
        )
    return user


@router.get("/all", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
):
    """List all users — for debugging."""
    return db.query(User).all()


@router.patch("/me", response_model=UserResponse)
def update_me(
    clerk_user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    user = db.query(User).filter(
        User.clerk_user_id == clerk_user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first at POST /api/v1/users/register",
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
        details={
            "email": new_user.email,
            "role": str(new_user.role),
        },
    )

    db.commit()
    db.refresh(new_user)
    return new_user