from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class SubscriptionPlan(str, Enum):
    FREE = "free"
    PREMIUM = "premium"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE, nullable=False)
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    payment_provider = Column(String(50), nullable=True)  # toss, stripe 등
    external_subscription_id = Column(String(255), nullable=True)  # 외부 결제 시스템 ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscription")
