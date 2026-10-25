from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from app import models, schemas
from app.database import get_db
from app.auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def issue_token(user: models.User) -> dict:
    access_token = create_access_token(
        data={"user_id": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Sign up endpoint - Public, always creates a Creator
@router.post("/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": 400,
                "error": "An account with this email already exists"
            }
        )

    creator_role = db.query(models.Role).filter(models.Role.role_name == "Creator").first()
    if not creator_role:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": 500,
                "error": "Creator role is missing. Run seed.py first."
            }
        )

    user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        role_id=creator_role.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return issue_token(user)


# Login endpoint
@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):

    # Find user by email (emails are stored lowercase)
    user = db.query(models.User).filter(
        models.User.email == user_credentials.email.strip().lower()
    ).first()

    # Same message for unknown email and wrong password, so the form doesn't reveal registered emails
    if not user or not verify_password(user_credentials.password, user.password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content = {
                "status" : 401,
                "error" : "Invalid email or password"
            }
        )

    return issue_token(user)

# Current logged-in user (with role)
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
