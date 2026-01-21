from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class DiaryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    mood: Optional[str] = None
    weather: Optional[str] = None
    diary_date: date


class DiaryCreate(DiaryBase):
    pass


class DiaryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    mood: Optional[str] = None
    weather: Optional[str] = None


class DiaryResponse(DiaryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiaryListResponse(BaseModel):
    items: list[DiaryResponse]
    total: int
    page: int
    per_page: int


class DiaryStats(BaseModel):
    total_count: int
    current_streak: int
    longest_streak: int
    mood_distribution: dict[str, int]
    monthly_count: dict[str, int]
    weekly_average: float


class DiaryPromptSuggestion(BaseModel):
    title: str
    description: str


class DiaryPromptSuggestionResponse(BaseModel):
    prompts: list[DiaryPromptSuggestion]
