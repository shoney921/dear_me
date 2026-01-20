from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class PersonaChat(Base):
    """페르소나와의 대화 세션"""

    __tablename__ = "persona_chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    persona_id = Column(
        Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False
    )
    is_own_persona = Column(Boolean, default=True)  # True: 내 페르소나, False: 친구 페르소나
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    persona = relationship("Persona", back_populates="chats")
    messages = relationship(
        "ChatMessage", back_populates="chat", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    """채팅 메시지"""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(
        Integer, ForeignKey("persona_chats.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)  # True: 사용자 메시지, False: 페르소나 응답
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    chat = relationship("PersonaChat", back_populates="messages")
