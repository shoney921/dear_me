from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.schemas.subscription import (
    SubscriptionResponse,
    SubscriptionStatusResponse,
    PremiumPlanInfo,
    UsageStatusResponse,
    UpgradeRequest,
)
from app.services.subscription_service import SubscriptionService
from app.constants.subscription import PREMIUM_FEATURES

router = APIRouter()


@router.get("/me", response_model=SubscriptionResponse)
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 구독 정보 조회"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        # 구독 정보가 없으면 무료 플랜으로 생성
        subscription = Subscription(
            user_id=current_user.id,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

    return subscription


@router.get("/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """구독 상태 조회"""
    subscription_service = SubscriptionService(db)
    detail = subscription_service.get_subscription_detail(current_user)
    return SubscriptionStatusResponse(**detail)


@router.get("/plans", response_model=list[PremiumPlanInfo])
def get_available_plans():
    """이용 가능한 플랜 목록"""
    return [
        PremiumPlanInfo(
            name="프리미엄 월간",
            price=4900,
            currency="KRW",
            features=PREMIUM_FEATURES,
            period_days=30,
        ),
        PremiumPlanInfo(
            name="프리미엄 연간",
            price=39900,
            currency="KRW",
            features=PREMIUM_FEATURES + ["2개월 무료 혜택"],
            period_days=365,
        ),
    ]


@router.get("/usage", response_model=UsageStatusResponse)
def get_usage_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """사용량 현황 조회"""
    subscription_service = SubscriptionService(db)
    return subscription_service.get_usage_status(current_user)


@router.post("/upgrade", response_model=SubscriptionResponse)
def upgrade_to_premium(
    body: UpgradeRequest = UpgradeRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """프리미엄으로 업그레이드 (테스트용 - 실제 결제 연동 전)"""
    if not body.is_valid_period:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription period",
        )

    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    now = datetime.utcnow()

    if not subscription:
        subscription = Subscription(
            user_id=current_user.id,
            plan=SubscriptionPlan.PREMIUM,
            status=SubscriptionStatus.ACTIVE,
            started_at=now,
            expires_at=now + timedelta(days=body.period_days),
        )
        db.add(subscription)
    else:
        # grace period 중 재구독: 남은 기간에 새 기간 합산
        if (
            subscription.status == SubscriptionStatus.CANCELLED
            and subscription.expires_at
            and subscription.expires_at > now
        ):
            subscription.expires_at = subscription.expires_at + timedelta(days=body.period_days)
        else:
            subscription.started_at = now
            subscription.expires_at = now + timedelta(days=body.period_days)

        subscription.plan = SubscriptionPlan.PREMIUM
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.cancelled_at = None

    db.commit()
    db.refresh(subscription)

    return subscription


@router.post("/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """구독 취소 (만료일까지 프리미엄 유지)"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    if subscription.plan == SubscriptionPlan.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel free plan",
        )

    if subscription.status == SubscriptionStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription already cancelled",
        )

    if subscription.status == SubscriptionStatus.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription already expired",
        )

    # plan과 expires_at은 유지 (grace period)
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription
