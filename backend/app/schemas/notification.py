from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field


class NotificationType(str, Enum):
    FRIEND_REQUEST = "friend_request"
    FRIEND_ACCEPTED = "friend_accepted"
    DIARY_REMINDER = "diary_reminder"
    PERSONA_UPDATED = "persona_updated"
    # Milestone notifications
    MILESTONE_3 = "milestone_3"  # 일기 3개 달성
    MILESTONE_5 = "milestone_5"  # 일기 5개 달성
    MILESTONE_7 = "milestone_7"  # 일기 7개 달성 (완전한 페르소나 생성 가능)
    PERSONA_UPGRADE_AVAILABLE = "persona_upgrade_available"  # 페르소나 업그레이드 가능
    PERSONA_UPGRADED = "persona_upgraded"  # 페르소나 업그레이드 완료
    # Chemistry notifications
    CHEMISTRY_REQUEST = "chemistry_request"  # 케미 분석 요청
    CHEMISTRY_ACCEPTED = "chemistry_accepted"  # 케미 분석 완료


class NotificationBase(BaseModel):
    type: NotificationType
    title: str = Field(..., max_length=200)
    content: Optional[str] = None
    related_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total_count: int
    unread_count: int


class NotificationMarkReadRequest(BaseModel):
    notification_ids: List[int] = Field(..., min_length=1)


class NotificationMarkAllReadResponse(BaseModel):
    updated_count: int
