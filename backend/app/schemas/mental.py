from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class RadarChartData(BaseModel):
    stress: int = Field(..., ge=0, le=100, description="스트레스 점수 (0-100, 낮을수록 좋음)")
    anxiety: int = Field(..., ge=0, le=100, description="불안 점수 (0-100, 낮을수록 좋음)")
    depression: int = Field(..., ge=0, le=100, description="우울 점수 (0-100, 낮을수록 좋음)")
    self_esteem: int = Field(..., ge=0, le=100, description="자존감 점수 (0-100, 높을수록 좋음)")
    positivity: int = Field(..., ge=0, le=100, description="긍정성 점수 (0-100, 높을수록 좋음)")
    social_connection: int = Field(..., ge=0, le=100, description="사회적 연결 점수 (0-100, 높을수록 좋음)")


class MentalAnalysisBase(BaseModel):
    stress_score: int = Field(50, ge=0, le=100)
    anxiety_score: int = Field(50, ge=0, le=100)
    depression_score: int = Field(50, ge=0, le=100)
    self_esteem_score: int = Field(50, ge=0, le=100)
    positivity_score: int = Field(50, ge=0, le=100)
    social_connection_score: int = Field(50, ge=0, le=100)
    overall_status: str


class MentalAnalysisResponse(MentalAnalysisBase):
    id: int
    user_id: int
    diary_id: Optional[int] = None
    analysis_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class MentalAnalysisWithFeedback(MentalAnalysisResponse):
    feedback: Optional["MentalFeedback"] = None


class MentalFeedback(BaseModel):
    status_label: str = Field(..., description="상태 레이블 (예: 좋음, 보통, 주의 필요)")
    message: str = Field(..., description="주요 피드백 메시지")
    encouragement: str = Field(..., description="응원 메시지")
    suggestion: Optional[str] = Field(None, description="제안 사항 (concerning/critical일 때)")
    emoji: str = Field(..., description="상태를 나타내는 이모지")


class BookRecommendation(BaseModel):
    title: str
    author: str
    description: str
    reason: str = Field(..., description="이 책을 추천하는 이유")
    category: str = Field(..., description="책 카테고리 (예: 자기계발, 에세이, 심리학 등)")


class BookRecommendationResponse(BaseModel):
    books: list[BookRecommendation]
    based_on_status: str = Field(..., description="추천 기준이 된 멘탈 상태")


class MentalHistoryItem(BaseModel):
    date: date
    overall_status: str
    stress_score: int
    anxiety_score: int
    depression_score: int
    self_esteem_score: int
    positivity_score: int
    social_connection_score: int

    class Config:
        from_attributes = True


class MentalHistoryResponse(BaseModel):
    items: list[MentalHistoryItem]
    total: int


class MentalReportBase(BaseModel):
    report_type: str
    period_start: date
    period_end: date
    avg_stress_score: int
    avg_anxiety_score: int
    avg_depression_score: int
    avg_self_esteem_score: int
    avg_positivity_score: int
    avg_social_connection_score: int
    trend: str


class MentalReportResponse(MentalReportBase):
    id: int
    user_id: int
    insights: Optional[list[str]] = None
    recommendations: Optional[list[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WeeklyReportResponse(MentalReportResponse):
    week_number: int
    daily_scores: Optional[list[dict]] = None


class MonthlyReportResponse(MentalReportResponse):
    month: int
    year: int
    weekly_averages: Optional[list[dict]] = None


class FeedbackRequest(BaseModel):
    analysis_id: Optional[int] = None


class RadarChartResponse(BaseModel):
    current: RadarChartData
    previous: Optional[RadarChartData] = None
    trend: str = Field(..., description="변화 추세 (improving, stable, declining)")


MentalAnalysisWithFeedback.model_rebuild()
