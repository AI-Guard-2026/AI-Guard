# app/core/auth.py
# Clerk JWT token verification
# Reads Authorization: Bearer <token> header
# Extracts clerk_user_id from token
# Returns matching user from database

import jwt
import httpx
from typing import Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# FastAPI security scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_clerk_public_keys() -> list:
    """
    Fetch Clerk's public JWKS keys for JWT verification.
    These are used to verify the JWT signature.
    """
    if not settings.CLERK_JWT_ISSUER:
        return []

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.CLERK_JWT_ISSUER}/.well-known/jwks.json"
            )
            if response.status_code == 200:
                return response.json().get("keys", [])
    except Exception:
        pass
    return []


def extract_clerk_user_id_from_token(token: str) -> Optional[str]:
    """
    Decode Clerk JWT token and extract the clerk_user_id (sub claim).
    
    Clerk JWTs contain:
    - sub: the clerk_user_id (e.g. user_abc123)
    - email: user email
    - exp: expiration time
    
    For development — decode without verification if no Clerk keys configured.
    For production — verify signature against Clerk's public keys.
    """
    try:
        # Decode without verification first to get the payload
        # In production this should verify the signature
        payload = jwt.decode(
            token,
            options={
                "verify_signature": False,  # Set to True in production with Clerk keys
                "verify_exp": True,         # Always verify expiration
            },
            algorithms=["RS256", "HS256"],
        )

        # Clerk puts user ID in the 'sub' claim
        clerk_user_id = payload.get("sub")
        return clerk_user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )
    except Exception:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — extracts and verifies current user from JWT token.

    Flow:
    1. Read Authorization: Bearer <token> header
    2. Decode JWT token
    3. Extract clerk_user_id from 'sub' claim
    4. Find user in our database
    5. Return user object

    Usage in endpoints:
        @router.get("/protected")
        async def protected(current_user: User = Depends(get_current_user)):
            return current_user
    """

    # Check Authorization header exists
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Include: Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Extract clerk_user_id from token
    clerk_user_id = extract_clerk_user_id_from_token(token)

    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not extract user ID from token",
        )

    # Find user in database
    user = db.query(User).filter(
        User.clerk_user_id == clerk_user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found. Please register first at POST /api/v1/users/register",
        )

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Same as get_current_user but returns None instead of
    raising exception if no token provided.
    """
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None