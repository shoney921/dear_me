from datetime import datetime, date

from sqlalchemy import Column, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class DailyUsage(Base):
    """일일 사용량 추적"""
    __tablename__ = "daily_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_date = Column(Date, default=date.today, nullable=False, index=True)
    chat_messages = Column(Integer, default=0)  # 해당 날짜에 보낸 채팅 메시지 수

    # Unique constraint: 한 유저당 하루에 하나의 레코드
    __table_args__ = (
        UniqueConstraint('user_id', 'usage_date', name='uq_daily_usage_user_date'),
    )

    # Relationships
    user = relationship("User")
