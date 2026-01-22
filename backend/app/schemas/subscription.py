from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.subscription import SubscriptionPlan, SubscriptionStatus


class SubscriptionBase(BaseModel):
    plan: SubscriptionPlan = SubscriptionPlan.FREE


class SubscriptionCreate(SubscriptionBase):
    payment_provider: Optional[str] = None
    external_subscription_id: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    plan: Optional[SubscriptionPlan] = None
    status: Optional[SubscriptionStatus] = None
    expires_at: Optional[datetime] = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    status: SubscriptionStatus
    started_at: datetime
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionStatusResponse(BaseModel):
    """구독 상태 간단 응답"""
    is_premium: bool
    plan: SubscriptionPlan
    expires_at: Optional[datetime] = None


class PremiumPlanInfo(BaseModel):
    """프리미엄 플랜 정보"""
    name: str
    price: int
    currency: str = "KRW"
    features: list[str]
    period_days: int = 30
