import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.business_logger import biz_log
from app.models.user import User
from app.schemas.auth import (
    Token,
    LoginRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserCreate
from app.services.email_service import (
    create_verification_token,
    send_verification_email,
    verify_token,
    create_password_reset_token,
    send_password_reset_email,
    verify_password_reset_token,
    invalidate_password_reset_token,
)

logger = logging.getLogger(__name__)

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

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified",
        )

    return user


def _create_token_response(user: User) -> dict:
    """토큰 생성 공통 로직"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
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
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    biz_log.user_register(user.username, user.email)

    # 인증 이메일 발송
    token = create_verification_token(user, db)
    email_sent = send_verification_email(user, token)

    if email_sent:
        message = "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요."
    else:
        message = "회원가입이 완료되었습니다. 인증 이메일 발송에 실패했습니다. 로그인 페이지에서 재발송할 수 있습니다."
        logger.warning(f"Verification email failed for user {user.email}")

    return RegisterResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        message=message,
    )


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


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """이메일 인증 토큰 검증"""
    user = verify_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    return {"message": "이메일 인증이 완료되었습니다."}


@router.post("/resend-verification")
def resend_verification(
    data: ResendVerificationRequest, db: Session = Depends(get_db)
):
    """인증 이메일 재발송"""
    # 항상 동일한 응답 (사용자 존재 여부 미노출)
    success_message = {"message": "인증 이메일이 발송되었습니다. 이메일을 확인해주세요."}

    user = db.query(User).filter(User.email == data.email).first()
    if not user or user.email_verified:
        return success_message

    # Rate limit: 1분 이내 재요청 차단
    if user.verification_token_expires_at:
        token_created_at = user.verification_token_expires_at - timedelta(
            hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS
        )
        if datetime.utcnow() - token_created_at < timedelta(minutes=1):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another verification email",
            )

    token = create_verification_token(user, db)
    send_verification_email(user, token)

    return success_message


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """비밀번호 초기화 이메일 발송"""
    # 항상 동일한 응답 (사용자 존재 여부 미노출)
    success_message = {"message": "비밀번호 초기화 이메일이 발송되었습니다. 이메일을 확인해주세요."}

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return success_message

    # Rate limit: 1분 이내 재요청 차단
    if user.password_reset_token_expires_at:
        token_created_at = user.password_reset_token_expires_at - timedelta(
            hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
        )
        if datetime.utcnow() - token_created_at < timedelta(minutes=1):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another password reset email",
            )

    token = create_password_reset_token(user, db)
    send_password_reset_email(user, token)

    return success_message


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest, db: Session = Depends(get_db)
):
    """비밀번호 재설정"""
    user = verify_password_reset_token(data.token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user.hashed_password = get_password_hash(data.password)
    invalidate_password_reset_token(user, db)

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}
