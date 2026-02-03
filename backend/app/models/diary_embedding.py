from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.config import settings
from app.core.database import Base


class DiaryEmbedding(Base):
    __tablename__ = "diary_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(
        Integer, ForeignKey("diaries.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    embedding = Column(Vector(settings.RAG_EMBEDDING_DIMENSION), nullable=False)
    text_hash = Column(String(64), nullable=False)  # SHA-256 hash for change detection
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    diary = relationship("Diary", back_populates="embedding")
