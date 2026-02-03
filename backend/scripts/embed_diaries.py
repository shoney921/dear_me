"""
기존 일기에 대한 임베딩 배치 생성 스크립트

사용법:
    docker-compose exec backend python -m scripts.embed_diaries

옵션:
    --force: 기존 임베딩이 있어도 모두 재생성
    --user-id: 특정 사용자의 일기만 처리
"""

import argparse
import logging
import sys
from typing import Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.diary import Diary
from app.models.diary_embedding import DiaryEmbedding
from app.services.embedding_service import EmbeddingService

# 로깅 설정
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def embed_diaries(db: Session, force: bool = False, user_id: Optional[int] = None) -> dict:
    """기존 일기에 대한 임베딩 생성"""
    stats = {"total": 0, "created": 0, "updated": 0, "skipped": 0, "failed": 0}

    # 일기 조회
    query = db.query(Diary)
    if user_id:
        query = query.filter(Diary.user_id == user_id)

    diaries = query.all()
    stats["total"] = len(diaries)

    logger.info(f"Processing {stats['total']} diaries...")

    for i, diary in enumerate(diaries, 1):
        try:
            # 기존 임베딩 확인
            existing = (
                db.query(DiaryEmbedding).filter(DiaryEmbedding.diary_id == diary.id).first()
            )

            if existing and not force:
                # 텍스트 해시 비교
                text = EmbeddingService.prepare_diary_text(diary)
                text_hash = EmbeddingService.compute_text_hash(text)

                if existing.text_hash == text_hash:
                    stats["skipped"] += 1
                    continue

            # 임베딩 생성/업데이트
            result = EmbeddingService.create_or_update_diary_embedding(db, diary)

            if existing:
                stats["updated"] += 1
            else:
                stats["created"] += 1

            if i % 10 == 0:
                logger.info(f"Progress: {i}/{stats['total']} diaries processed")

        except Exception as e:
            logger.error(f"Failed to embed diary {diary.id}: {e}")
            stats["failed"] += 1

    return stats


def main():
    parser = argparse.ArgumentParser(description="Batch embed existing diaries")
    parser.add_argument(
        "--force", action="store_true", help="Force re-embed all diaries even if unchanged"
    )
    parser.add_argument("--user-id", type=int, help="Process only diaries for this user ID")

    args = parser.parse_args()

    logger.info("Starting diary embedding batch process...")
    logger.info(f"Options: force={args.force}, user_id={args.user_id}")

    db = SessionLocal()
    try:
        # 모델 사전 로드 (첫 호출 시 로드되는 시간 미리 처리)
        logger.info("Loading embedding model (this may take a moment)...")
        EmbeddingService.get_model()

        stats = embed_diaries(db, force=args.force, user_id=args.user_id)

        logger.info("=" * 50)
        logger.info("Embedding batch process completed!")
        logger.info(f"  Total diaries: {stats['total']}")
        logger.info(f"  Created: {stats['created']}")
        logger.info(f"  Updated: {stats['updated']}")
        logger.info(f"  Skipped (unchanged): {stats['skipped']}")
        logger.info(f"  Failed: {stats['failed']}")
        logger.info("=" * 50)

    except Exception as e:
        logger.error(f"Batch process failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
