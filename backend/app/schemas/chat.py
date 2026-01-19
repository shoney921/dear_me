from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class ChatMessageBase(BaseModel):
    """채팅 메시지 기본 스키마"""
    role: Literal["user", "assistant"]
    content: str


class ChatMessageCreate(ChatMessageBase):
    """채팅 메시지 생성 요청"""
    pass


class ChatMessageResponse(ChatMessageBase):
    """채팅 메시지 응답"""
    id: int
    chat_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PersonaChatBase(BaseModel):
    """페르소나 대화 기본 스키마"""
    title: Optional[str] = None


class PersonaChatCreate(PersonaChatBase):
    """페르소나 대화 생성 요청"""
    pass


class PersonaChatResponse(PersonaChatBase):
    """페르소나 대화 응답"""
    id: int
    persona_id: int
    requester_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # 추가 정보
    persona_name: Optional[str] = None
    owner_name: Optional[str] = None
    last_message: Optional[str] = None
    message_count: int = 0

    class Config:
        from_attributes = True


class PersonaChatDetailResponse(PersonaChatResponse):
    """페르소나 대화 상세 응답 (메시지 포함)"""
    messages: List[ChatMessageResponse] = Field(default_factory=list)


class SendMessageRequest(BaseModel):
    """메시지 전송 요청"""
    content: str = Field(..., min_length=1, max_length=2000)


class SendMessageResponse(BaseModel):
    """메시지 전송 응답"""
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class ChatListResponse(BaseModel):
    """대화 목록 응답"""
    chats: List[PersonaChatResponse]
    total: int
    page: int
    limit: int


class StreamingMessageChunk(BaseModel):
    """스트리밍 메시지 청크"""
    content: str
    is_complete: bool = False
    message_id: Optional[int] = None
