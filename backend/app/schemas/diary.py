from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DiaryBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    mood: Optional[str] = Field(None, description="happy, sad, angry, calm, excited, anxious")
    weather: Optional[str] = Field(None, description="sunny, cloudy, rainy, snowy, windy")
    is_private: bool = Field(default=False, description="페르소나 생성에서 제외 여부")


class DiaryCreate(DiaryBase):
    date: Optional[date] = Field(None, description="작성 날짜 (기본값: 오늘)")


class DiaryUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    mood: Optional[str] = None
    weather: Optional[str] = None
    is_private: Optional[bool] = None


class DiaryResponse(DiaryBase):
    id: int
    user_id: int
    date: date
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DiaryListResponse(BaseModel):
    items: List[DiaryResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class DiaryStatsResponse(BaseModel):
    total: int
    streak: int
    moods: dict
    this_month_count: int
