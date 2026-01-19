from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100))  # 페르소나 이름
    personality = Column(Text)  # AI 분석 성격 설명
    traits = Column(JSON)  # ["외향적", "감성적", ...]
    speaking_style = Column(Text)  # 말투 특성
    summary = Column(Text)  # 종합 요약
    interests = Column(JSON)  # ["독서", "카페", ...]
    is_public = Column(Boolean, default=True)  # 친구에게 공개 여부
    last_updated = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="persona")
    chats = relationship("PersonaChat", back_populates="persona", cascade="all, delete-orphan")
