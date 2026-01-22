from datetime import datetime
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator:
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """현재 인증된 사용자 조회"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """활성화된 현재 사용자 조회"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def check_premium_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> bool:
    """프리미엄 구독 여부 확인 (의존성)"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        return False

    is_premium = (
        subscription.plan == SubscriptionPlan.PREMIUM
        and subscription.status == SubscriptionStatus.ACTIVE
        and (subscription.expires_at is None or subscription.expires_at > datetime.utcnow())
    )

    return is_premium


def require_premium(
    is_premium: bool = Depends(check_premium_subscription),
) -> bool:
    """프리미엄 구독 필수 (의존성)"""
    if not is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required for this feature",
        )
    return is_premium
