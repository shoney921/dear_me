from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PersonaGenerateRequest(BaseModel):
    """페르소나 생성 요청 (AI가 자동 생성)"""

    pass


class PersonaGenerateResponse(BaseModel):
    """페르소나 생성 응답"""

    persona: PersonaResponse
    message: str
