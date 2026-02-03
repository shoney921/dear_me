from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    mood = Column(String(50), nullable=True)  # happy, sad, angry, etc.
    weather = Column(String(50), nullable=True)  # sunny, rainy, cloudy, etc.
    diary_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="diaries")
    mental_analysis = relationship(
        "MentalAnalysis", back_populates="diary", uselist=False, cascade="all, delete-orphan"
    )
    embedding = relationship(
        "DiaryEmbedding", back_populates="diary", uselist=False, cascade="all, delete-orphan"
    )
