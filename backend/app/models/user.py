from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    profile_image = Column(String(500), nullable=True)
    rag_context_level = Column(String(20), nullable=True)  # None이면 시스템 기본값 사용
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    diaries = relationship("Diary", back_populates="user", cascade="all, delete-orphan")
    persona = relationship(
        "Persona", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    subscription = relationship(
        "Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    mental_analyses = relationship(
        "MentalAnalysis", back_populates="user", cascade="all, delete-orphan"
    )
    mental_reports = relationship(
        "MentalReport", back_populates="user", cascade="all, delete-orphan"
    )
