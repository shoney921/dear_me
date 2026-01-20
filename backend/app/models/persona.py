from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name = Column(String(100), nullable=False)
    personality = Column(Text, nullable=False)  # AI가 생성한 성격 설명
    traits = Column(Text, nullable=True)  # JSON 형태의 특성 목록
    speaking_style = Column(Text, nullable=True)  # 말투 스타일
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="persona")
    chats = relationship(
        "PersonaChat", back_populates="persona", cascade="all, delete-orphan"
    )
