# app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# bcrypt only uses the first 72 bytes of a password; cut explicitly so long passwords behave the same everywhere
BCRYPT_MAX_BYTES = 72

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Hash password
def hash_password(password: str) -> str:
    # Convert plain password to a bcrypt hash ($2b$, the same format passlib produced)
    return bcrypt.hashpw(password.encode("utf-8")[:BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode("utf-8")

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Check if plain password matches hashed password
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:BCRYPT_MAX_BYTES], hashed_password.encode("utf-8"))
    except ValueError:  # Not a valid bcrypt hash
        return False

# Create JWT token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # Generate JWT token with expiration
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Get current user from token (Base authentication check)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Validates JWT token and returns the authenticated user.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "status": 401,
            "error": "Could not validate credentials"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the token and check for expiration
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": True})
        user_id: int = payload.get("user_id")

        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Retrieve the user from the database
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# AUTHORIZATION CHECKS (Role-based permissions)
def require_admin(current_user: models.User = Depends(get_current_user)):
    # Dependency to ensure user is Admin.
    # Use this for routes that ONLY admins can access.
    if current_user.role.role_name != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": 403,
                "error": "Only Admin can perform this action"
            })
    return current_user


def require_creator_or_admin(current_user: models.User = Depends(get_current_user)):
    # Dependency to ensure user is either Creator or Admin.
    # Use this for routes that both Creators and Admins can access (like creating tests).
    if current_user.role.role_name not in ["Admin", "Creator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": 403,
                "error": "Only Admin or Creator can perform this action"
            })
    return current_user
