from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.character import CharacterStyle


class CharacterBase(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    style: CharacterStyle = CharacterStyle.ANIME


class CharacterCreate(CharacterBase):
    pass


class CharacterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    style: Optional[CharacterStyle] = None


class CharacterResponse(CharacterBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    generation_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CharacterHistoryResponse(BaseModel):
    id: int
    image_url: str
    style: CharacterStyle
    diary_count_at_generation: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterWithHistory(CharacterResponse):
    history: list[CharacterHistoryResponse] = []


class CharacterGenerateRequest(BaseModel):
    """캐릭터 생성 요청"""
    style: CharacterStyle = CharacterStyle.ANIME
    name: Optional[str] = Field(None, max_length=100)


class CharacterStyleChangeRequest(BaseModel):
    """캐릭터 스타일 변경 요청 (프리미엄)"""
    style: CharacterStyle


class CharacterGenerationStatus(BaseModel):
    """캐릭터 생성 가능 상태"""
    can_generate: bool
    has_character: bool
    has_persona: bool = False  # 페르소나 유무 (캐릭터 생성 전제조건)
    diary_count: int
    required_diary_count: int = 7
    can_evolve: bool = False  # 30개 단위 진화 가능 여부
    next_evolution_at: Optional[int] = None  # 다음 진화까지 필요한 일기 수
