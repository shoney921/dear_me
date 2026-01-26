from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.business_logger import biz_log
from app.models.user import User
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


def _authenticate_user(
    db: Session, email: str, password: str, include_www_auth: bool = False
) -> User:
    """사용자 인증 공통 로직"""
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        headers = {"WWW-Authenticate": "Bearer"} if include_www_auth else None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers=headers,
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user


def _create_token_response(user: User) -> dict:
    """토큰 생성 공통 로직"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> User:
    """회원가입"""
    # 이메일 중복 체크
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 사용자명 중복 체크
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # 사용자 생성
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    biz_log.user_register(user.username, user.email)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> dict:
    """로그인 (OAuth2 호환)"""
    user = _authenticate_user(db, form_data.username, form_data.password, include_www_auth=True)
    biz_log.user_login(user.username)
    return _create_token_response(user)


@router.post("/login/json", response_model=Token)
def login_json(login_data: LoginRequest, db: Session = Depends(get_db)) -> dict:
    """로그인 (JSON)"""
    user = _authenticate_user(db, login_data.email, login_data.password)
    biz_log.user_login(user.username)
    return _create_token_response(user)
