from datetime import date, datetime
from enum import Enum

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class OverallStatus(str, Enum):
    GOOD = "good"
    NEUTRAL = "neutral"
    CONCERNING = "concerning"
    CRITICAL = "critical"


class MentalAnalysis(Base):
    __tablename__ = "mental_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diary_id = Column(Integer, ForeignKey("diaries.id", ondelete="CASCADE"), nullable=True)

    # 점수 (0-100, 50이 중립, 모두 높을수록 좋음)
    emotional_stability_score = Column(Integer, default=50)
    vitality_score = Column(Integer, default=50)
    self_esteem_score = Column(Integer, default=50)
    positivity_score = Column(Integer, default=50)
    social_connection_score = Column(Integer, default=50)
    resilience_score = Column(Integer, default=50)

    # 종합 상태
    overall_status = Column(String(20), default=OverallStatus.NEUTRAL.value)
    ai_analysis_raw = Column(Text, nullable=True)  # JSON 형태의 AI 분석 원본
    feedback_json = Column(Text, nullable=True)  # JSON 형태의 사전 생성된 피드백

    analysis_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="mental_analyses")
    diary = relationship("Diary", back_populates="mental_analysis")
