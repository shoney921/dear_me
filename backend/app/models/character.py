from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class CharacterStyle(str, Enum):
    WATERCOLOR = "watercolor"  # 수채화
    ANIME = "anime"  # 애니메이션
    PIXEL = "pixel"  # 픽셀 아트
    THREED = "3d"  # 3D 렌더링
    REALISTIC = "realistic"  # 실사
    CARTOON = "cartoon"  # 카툰


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=True)  # 캐릭터 이름
    image_url = Column(String(500), nullable=True)  # 메인 이미지 URL
    thumbnail_url = Column(String(500), nullable=True)  # 썸네일 URL
    style = Column(SQLEnum(CharacterStyle), default=CharacterStyle.ANIME, nullable=False)
    prompt_used = Column(Text, nullable=True)  # 생성에 사용된 프롬프트
    generation_count = Column(Integer, default=1)  # 생성 횟수 (진화 트래킹)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="character")
    history = relationship("CharacterHistory", back_populates="character", cascade="all, delete-orphan")


class CharacterHistory(Base):
    """캐릭터 진화 히스토리"""
    __tablename__ = "character_history"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    style = Column(SQLEnum(CharacterStyle), nullable=False)
    prompt_used = Column(Text, nullable=True)
    diary_count_at_generation = Column(Integer, nullable=True)  # 생성 시점의 일기 수
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    character = relationship("Character", back_populates="history")
