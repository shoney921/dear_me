import asyncio
import json
import logging

from app.core.database import SessionLocal
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


def process_diary_embedding(diary_id: int) -> None:
    """백그라운드에서 일기 임베딩 생성/업데이트 (동기 함수)"""
    db = SessionLocal()
    try:
        from app.models.diary import Diary

        diary = db.query(Diary).filter(Diary.id == diary_id).first()
        if not diary:
            logger.warning(f"Background embedding: diary {diary_id} not found")
            return

        EmbeddingService.create_or_update_diary_embedding(db, diary)
        logger.info(f"Background embedding created for diary {diary_id}")
    except Exception as e:
        logger.error(f"Background embedding failed for diary {diary_id}: {e}")
    finally:
        db.close()


def process_diary_mental_analysis(user_id: int, diary_id: int, is_update: bool = False) -> None:
    """백그라운드에서 멘탈 분석 + 피드백 생성 (동기 함수, 내부에서 async 실행)"""
    db = SessionLocal()
    try:
        from app.models.diary import Diary
        from app.models.user import User
        from app.models.mental_analysis import MentalAnalysis
        from app.services.mental_service import MentalService

        user = db.query(User).filter(User.id == user_id).first()
        diary = db.query(Diary).filter(Diary.id == diary_id).first()
        if not user or not diary:
            logger.warning(f"Background mental analysis: user {user_id} or diary {diary_id} not found")
            return

        # 수정 시 기존 분석 삭제
        if is_update:
            db.query(MentalAnalysis).filter(MentalAnalysis.diary_id == diary_id).delete()
            db.commit()

        mental_service = MentalService(db)

        # async 코드를 새 이벤트루프에서 실행
        loop = asyncio.new_event_loop()
        try:
            analysis = loop.run_until_complete(mental_service.analyze_diary(user, diary))

            if not is_update:
                feedback = loop.run_until_complete(mental_service.generate_feedback(analysis))
                analysis.feedback_json = json.dumps(feedback, ensure_ascii=False)
                db.commit()
        finally:
            loop.close()

        logger.info(f"Background mental analysis completed for diary {diary_id}")
    except Exception as e:
        logger.error(f"Background mental analysis failed for diary {diary_id}: {e}")
    finally:
        db.close()
