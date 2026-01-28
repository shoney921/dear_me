from datetime import date, datetime
from enum import Enum

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReportType(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class TrendType(str, Enum):
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"


class MentalReport(Base):
    __tablename__ = "mental_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String(20), nullable=False)  # weekly, monthly
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    # 평균 점수
    avg_stress_score = Column(Integer, default=50)
    avg_anxiety_score = Column(Integer, default=50)
    avg_depression_score = Column(Integer, default=50)
    avg_self_esteem_score = Column(Integer, default=50)
    avg_positivity_score = Column(Integer, default=50)
    avg_social_connection_score = Column(Integer, default=50)

    # 추세 및 인사이트
    trend = Column(String(20), default=TrendType.STABLE.value)  # improving, stable, declining
    insights = Column(Text, nullable=True)  # JSON
    recommendations = Column(Text, nullable=True)  # JSON

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="mental_reports")
