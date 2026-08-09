import bcrypt
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.operations import (
    get_user_by_username,
    create_user,
    update_user_password,
    get_all_users
)
from app.schemas.schemas import (
    UserLoginRequestSchema,
    ChangePasswordRequestSchema,
    UserResponseSchema
)
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(plain_password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.error(f"Bcrypt verification error: {e}")
        return False

@router.post("/login")
def login(payload: UserLoginRequestSchema, db: Session = Depends(get_db)):
    """
    Authenticates user credentials against the SQLite database.
    """
    username = payload.username.strip().lower()
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password for selected role."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password entered."
        )

    if payload.role and payload.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account role mismatch."
        )

    logger.info(f"User '{user.username}' successfully authenticated for role '{user.role}'.")
    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "updated_at": user.updated_at
        }
    }

@router.post("/change-password")
def change_password(payload: ChangePasswordRequestSchema, db: Session = Depends(get_db)):
    """
    Changes a user's password securely with bcrypt server-side hashing.
    """
    new_password = payload.new_password
    if not new_password or len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    target_username = (payload.target_username or "admin").strip().lower()
    requester_role = (payload.requester_role or "admin").strip().lower()

    # Rule: Hiring Manager can only change their own password
    if requester_role == "hiring_manager" and target_username != "hiringmanager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hiring Managers are not permitted to alter Admin credentials."
        )

    target_user = get_user_by_username(db, target_username)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User account '{target_username}' not found."
        )

    # If changing own password (or if requester is not admin resetting another user), verify current password
    is_self_change = (payload.target_username is None) or (payload.target_username.strip().lower() == "admin" and requester_role == "admin") or (target_username == "hiringmanager" and requester_role == "hiring_manager")
    
    if payload.current_password or is_self_change:
        if not payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to update password."
            )
        if not verify_password(payload.current_password, target_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password entered."
            )

    new_hash = hash_password(new_password)
    updated_user = update_user_password(db, target_username, new_hash)

    logger.info(f"Password successfully changed for user '{target_username}'.")
    return {
        "status": "success",
        "message": "Password updated successfully.",
        "user": {
            "username": updated_user.username,
            "role": updated_user.role,
            "updated_at": updated_user.updated_at
        }
    }

@router.get("/users", response_model=List[UserResponseSchema])
def list_users(db: Session = Depends(get_db)):
    """
    Returns registered user accounts metadata (excluding password hashes).
    """
    return get_all_users(db)
