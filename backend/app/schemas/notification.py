from datetime import datetime
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, Field


class NotificationType(str, Enum):
    FRIEND_REQUEST = "friend_request"
    FRIEND_ACCEPTED = "friend_accepted"
    DIARY_REMINDER = "diary_reminder"
    PERSONA_UPDATED = "persona_updated"


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
