from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PersonaBase(BaseModel):
    """페르소나 기본 스키마"""
    name: Optional[str] = None
    is_public: bool = True


class PersonaCreate(PersonaBase):
    """페르소나 생성 요청 (내부 사용)"""
    user_id: int
    personality: str
    traits: List[str]
    speaking_style: str
    summary: str
    interests: List[str]


class PersonaUpdate(BaseModel):
    """페르소나 설정 수정 요청"""
    name: Optional[str] = None
    is_public: Optional[bool] = None


class PersonaGenerateRequest(BaseModel):
    """페르소나 생성/재생성 요청"""
    force_regenerate: bool = False


class PersonaResponse(BaseModel):
    """페르소나 응답"""
    id: int
    user_id: int
    name: Optional[str] = None
    personality: Optional[str] = None
    traits: List[str] = Field(default_factory=list)
    speaking_style: Optional[str] = None
    summary: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    is_public: bool = True
    last_updated: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PersonaPublicResponse(BaseModel):
    """친구에게 공개되는 페르소나 정보 (제한적)"""
    id: int
    user_id: int
    name: Optional[str] = None
    personality: Optional[str] = None
    traits: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class PersonaGenerationResult(BaseModel):
    """LLM 페르소나 생성 결과"""
    personality: str
    traits: List[str]
    speaking_style: str
    summary: str
    interests: List[str]


class PersonaStatusResponse(BaseModel):
    """페르소나 생성 가능 상태 응답"""
    can_generate: bool
    diary_count: int
    required_count: int = 7
    has_persona: bool
    message: str
