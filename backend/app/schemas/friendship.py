from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.friendship import FriendshipStatus
from app.schemas.user import UserResponse


class FriendshipBase(BaseModel):
    addressee_id: int


class FriendshipCreate(FriendshipBase):
    pass


class FriendshipUpdate(BaseModel):
    status: FriendshipStatus


class FriendshipResponse(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: FriendshipStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FriendshipWithUser(FriendshipResponse):
    requester: Optional[UserResponse] = None
    addressee: Optional[UserResponse] = None


class FriendListResponse(BaseModel):
    friends: list[UserResponse]
    total: int
