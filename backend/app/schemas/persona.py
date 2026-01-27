import json
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


class PersonaCustomization(BaseModel):
    """페르소나 커스터마이징 설정"""
    speaking_style_tone: Optional[str] = Field(None, description="말투 톤: formal, casual, cute")
    speaking_style_emoji: Optional[bool] = Field(None, description="이모지 사용 여부")
    personality_traits_override: Optional[List[str]] = Field(None, description="사용자 지정 성격 특성")
    custom_greeting: Optional[str] = Field(None, max_length=200, description="커스텀 인사말")


class PersonaBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    personality: str
    traits: Optional[List[str]] = None
    speaking_style: Optional[str] = None
    avatar_url: Optional[str] = None


class PersonaCreate(PersonaBase):
    pass


class PersonaResponse(PersonaBase):
    id: int
    user_id: int
    is_public: bool = True
    customization: Optional[PersonaCustomization] = None
    level: str = "complete"  # temporary, basic, complete
    created_at: datetime
    updated_at: datetime

    @field_validator('traits', mode='before')
    @classmethod
    def parse_traits(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v

    @field_validator('customization', mode='before')
    @classmethod
    def parse_customization(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v

    class Config:
        from_attributes = True


class PersonaGenerateRequest(BaseModel):
    """페르소나 생성 요청 (AI가 자동 생성)"""

    pass


class PersonaGenerateResponse(BaseModel):
    """페르소나 생성 응답"""

    persona: PersonaResponse
    message: str

    class Config:
        from_attributes = True


class PersonaUpdateRequest(BaseModel):
    """페르소나 설정 수정 요청 (B1)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_public: Optional[bool] = None


class PersonaCustomizeRequest(BaseModel):
    """페르소나 커스터마이징 요청 (B3)"""
    speaking_style_tone: Optional[str] = Field(None, pattern="^(formal|casual|cute)$")
    speaking_style_emoji: Optional[bool] = None
    personality_traits_override: Optional[List[str]] = Field(None, max_length=10)
    custom_greeting: Optional[str] = Field(None, max_length=200)


class PersonaCustomizeResponse(BaseModel):
    """페르소나 커스터마이징 응답"""
    id: int
    customization: PersonaCustomization
    updated_at: datetime

    class Config:
        from_attributes = True
