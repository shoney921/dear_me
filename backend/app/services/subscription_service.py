from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.usage import DailyUsage
from app.models.friendship import Friendship, FriendshipStatus
from app.constants.subscription import FREE_PLAN_LIMITS, PREMIUM_PLAN_LIMITS


class SubscriptionService:
    def __init__(self, db: Session):
        self.db = db

    def is_premium(self, user: User) -> bool:
        """사용자가 프리미엄인지 확인 (grace period 포함)"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if not subscription:
            return False

        if subscription.plan != SubscriptionPlan.PREMIUM:
            return False

        # 만료일 체크
        if subscription.expires_at and subscription.expires_at <= datetime.utcnow():
            # 만료됨 → 자동으로 EXPIRED 전환
            subscription.status = SubscriptionStatus.EXPIRED
            subscription.plan = SubscriptionPlan.FREE
            self.db.commit()
            return False

        # ACTIVE 또는 CANCELLED(grace period)이면 프리미엄 유지
        return subscription.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED)

    def get_subscription_detail(self, user: User) -> dict:
        """구독 상세 정보 조회 (status 엔드포인트용)"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if not subscription:
            return {
                "is_premium": False,
                "plan": SubscriptionPlan.FREE,
                "status": SubscriptionStatus.ACTIVE,
                "expires_at": None,
                "cancelled_at": None,
                "days_remaining": None,
                "is_in_grace_period": False,
            }

        is_premium = self.is_premium(user)
        # is_premium 호출 후 subscription을 다시 읽어야 자동 만료 반영됨
        self.db.refresh(subscription)

        days_remaining = None
        if subscription.expires_at and subscription.expires_at > datetime.utcnow():
            delta = subscription.expires_at - datetime.utcnow()
            days_remaining = delta.days

        is_in_grace_period = (
            subscription.status == SubscriptionStatus.CANCELLED
            and is_premium
        )

        return {
            "is_premium": is_premium,
            "plan": subscription.plan,
            "status": subscription.status,
            "expires_at": subscription.expires_at,
            "cancelled_at": subscription.cancelled_at,
            "days_remaining": days_remaining,
            "is_in_grace_period": is_in_grace_period,
        }

    def get_plan_limits(self, user: User) -> dict:
        """사용자의 플랜 제한 조회"""
        if self.is_premium(user):
            return PREMIUM_PLAN_LIMITS
        return FREE_PLAN_LIMITS

    def get_daily_chat_usage(self, user: User) -> int:
        """오늘의 채팅 사용량 조회"""
        today = date.today()
        usage = self.db.query(DailyUsage).filter(
            DailyUsage.user_id == user.id,
            DailyUsage.usage_date == today,
        ).first()

        return usage.chat_messages if usage else 0

    def increment_chat_usage(self, user: User) -> int:
        """채팅 사용량 증가 및 현재 사용량 반환"""
        from sqlalchemy.exc import IntegrityError

        today = date.today()

        # with_for_update()로 레코드 락 획득 (race condition 방지)
        usage = self.db.query(DailyUsage).filter(
            DailyUsage.user_id == user.id,
            DailyUsage.usage_date == today,
        ).with_for_update().first()

        if not usage:
            try:
                usage = DailyUsage(
                    user_id=user.id,
                    usage_date=today,
                    chat_messages=1,
                )
                self.db.add(usage)
                self.db.commit()
            except IntegrityError:
                # 동시 요청으로 이미 레코드가 생성된 경우
                self.db.rollback()
                usage = self.db.query(DailyUsage).filter(
                    DailyUsage.user_id == user.id,
                    DailyUsage.usage_date == today,
                ).with_for_update().first()
                usage.chat_messages += 1
                self.db.commit()
        else:
            usage.chat_messages += 1
            self.db.commit()

        return usage.chat_messages

    def can_send_chat_message(self, user: User) -> tuple[bool, Optional[str]]:
        """채팅 메시지 전송 가능 여부 확인"""
        if self.is_premium(user):
            return True, None

        limits = FREE_PLAN_LIMITS
        daily_limit = limits.get("daily_chat_messages", 5)
        current_usage = self.get_daily_chat_usage(user)

        if current_usage >= daily_limit:
            return False, f"일일 대화 횟수 {daily_limit}회를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한 대화가 가능해요!"

        return True, None

    def can_add_friend(self, user: User) -> tuple[bool, Optional[str]]:
        """친구 추가 가능 여부 확인"""
        if self.is_premium(user):
            return True, None

        limits = FREE_PLAN_LIMITS
        max_friends = limits.get("max_friends", 3)

        # 현재 친구 수 조회
        friend_count = self.db.query(func.count(Friendship.id)).filter(
            ((Friendship.requester_id == user.id) | (Friendship.addressee_id == user.id)),
            Friendship.status == FriendshipStatus.ACCEPTED,
        ).scalar()

        if friend_count >= max_friends:
            return False, f"무료 플랜에서는 친구를 최대 {max_friends}명까지 추가할 수 있어요. 프리미엄으로 업그레이드하면 무제한 친구 추가가 가능해요!"

        return True, None

    def can_chat_with_friend_persona(self, user: User) -> tuple[bool, Optional[str]]:
        """친구 페르소나와 대화 가능 여부 확인"""
        # 무료 사용자도 친구 페르소나 대화 허용
        return True, None

    def get_remaining_chat_messages(self, user: User) -> Optional[int]:
        """남은 채팅 횟수 조회 (프리미엄은 None 반환)"""
        if self.is_premium(user):
            return None

        limits = FREE_PLAN_LIMITS
        daily_limit = limits.get("daily_chat_messages", 5)
        current_usage = self.get_daily_chat_usage(user)

        return max(0, daily_limit - current_usage)

    def get_usage_status(self, user: User) -> dict:
        """사용량 현황 조회"""
        is_premium = self.is_premium(user)
        limits = self.get_plan_limits(user)

        # 친구 수 조회
        friend_count = self.db.query(func.count(Friendship.id)).filter(
            ((Friendship.requester_id == user.id) | (Friendship.addressee_id == user.id)),
            Friendship.status == FriendshipStatus.ACCEPTED,
        ).scalar()

        return {
            "is_premium": is_premium,
            "plan": "premium" if is_premium else "free",
            "daily_chat_messages": {
                "used": self.get_daily_chat_usage(user),
                "limit": limits.get("daily_chat_messages"),
                "remaining": self.get_remaining_chat_messages(user),
            },
            "friends": {
                "count": friend_count,
                "limit": limits.get("max_friends"),
            },
            "features": {
                "can_chat_with_friends": limits.get("can_chat_with_friends"),
                "advanced_stats": limits.get("advanced_stats"),
                "chemistry_analysis": limits.get("chemistry_analysis"),
            },
        }
