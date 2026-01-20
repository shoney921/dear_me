from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    content: str = Field(..., min_length=1)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    chat_id: int
    is_user: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatBase(BaseModel):
    persona_id: int


class ChatCreate(ChatBase):
    pass


class ChatResponse(BaseModel):
    id: int
    user_id: int
    persona_id: int
    is_own_persona: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatWithMessages(ChatResponse):
    messages: List[MessageResponse] = []


class ChatListResponse(BaseModel):
    items: list[ChatResponse]
    total: int
