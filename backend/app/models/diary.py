from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    mood = Column(String(50))  # happy, sad, angry, calm, excited, anxious
    weather = Column(String(50))  # sunny, cloudy, rainy, snowy, windy
    date = Column(Date, nullable=False)
    is_private = Column(Boolean, default=False)  # 페르소나 생성에서 제외
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Unique constraint: 하루에 하나의 일기
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
    )

    # Relationships
    user = relationship("User", back_populates="diaries")
