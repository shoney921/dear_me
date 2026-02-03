import hashlib
import logging
from typing import List, Optional, Tuple

from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.diary import Diary
from app.models.diary_embedding import DiaryEmbedding

logger = logging.getLogger(__name__)


class EmbeddingService:
    _model: Optional[SentenceTransformer] = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """싱글톤 패턴으로 모델 로드 (최초 호출 시에만 로드)"""
        if cls._model is None:
            logger.info(f"Loading embedding model: {settings.RAG_EMBEDDING_MODEL}")
            cls._model = SentenceTransformer(settings.RAG_EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully")
        return cls._model

    @staticmethod
    def compute_text_hash(text: str) -> str:
        """텍스트 해시 계산 (변경 감지용)"""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @staticmethod
    def prepare_diary_text(diary: Diary) -> str:
        """일기를 임베딩용 텍스트로 변환"""
        parts = [diary.title, diary.content]
        if diary.mood:
            parts.append(f"기분: {diary.mood}")
        if diary.weather:
            parts.append(f"날씨: {diary.weather}")
        return " ".join(parts)

    @classmethod
    def create_embedding(cls, text: str) -> List[float]:
        """텍스트를 임베딩 벡터로 변환"""
        model = cls.get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    @classmethod
    def create_or_update_diary_embedding(cls, db: Session, diary: Diary) -> DiaryEmbedding:
        """일기 임베딩 생성 또는 업데이트"""
        text = cls.prepare_diary_text(diary)
        text_hash = cls.compute_text_hash(text)

        existing = db.query(DiaryEmbedding).filter(DiaryEmbedding.diary_id == diary.id).first()

        if existing:
            # 텍스트가 변경되지 않았으면 스킵
            if existing.text_hash == text_hash:
                logger.debug(f"Diary {diary.id} embedding unchanged, skipping")
                return existing

            # 텍스트 변경 시 임베딩 업데이트
            logger.info(f"Updating embedding for diary {diary.id}")
            embedding = cls.create_embedding(text)
            existing.embedding = embedding
            existing.text_hash = text_hash
            db.commit()
            db.refresh(existing)
            return existing

        # 새 임베딩 생성
        logger.info(f"Creating embedding for diary {diary.id}")
        embedding = cls.create_embedding(text)
        diary_embedding = DiaryEmbedding(
            diary_id=diary.id,
            embedding=embedding,
            text_hash=text_hash,
        )
        db.add(diary_embedding)
        db.commit()
        db.refresh(diary_embedding)
        return diary_embedding

    @classmethod
    def search_similar_diaries(
        cls,
        db: Session,
        query: str,
        user_id: int,
        top_k: int = None,
        similarity_threshold: float = None,
    ) -> List[Tuple[Diary, float]]:
        """
        유사한 일기 검색

        Args:
            db: 데이터베이스 세션
            query: 검색 쿼리
            user_id: 검색 대상 사용자 ID
            top_k: 반환할 최대 결과 수
            similarity_threshold: 최소 유사도 임계값

        Returns:
            (Diary, similarity_score) 튜플 리스트
        """
        if top_k is None:
            top_k = settings.RAG_TOP_K
        if similarity_threshold is None:
            similarity_threshold = settings.RAG_SIMILARITY_THRESHOLD

        query_embedding = cls.create_embedding(query)
        query_embedding_str = str(query_embedding)

        # pgvector cosine similarity search
        # 1 - cosine distance = cosine similarity
        # CAST 사용하여 SQLAlchemy 파라미터 바인딩 충돌 방지
        result = db.execute(
            text(
                """
                SELECT
                    de.diary_id,
                    1 - (de.embedding <=> CAST(:query_embedding AS vector)) as similarity
                FROM diary_embeddings de
                JOIN diaries d ON d.id = de.diary_id
                WHERE d.user_id = :user_id
                    AND 1 - (de.embedding <=> CAST(:query_embedding AS vector)) >= :threshold
                ORDER BY de.embedding <=> CAST(:query_embedding AS vector)
                LIMIT :top_k
                """
            ),
            {
                "query_embedding": query_embedding_str,
                "user_id": user_id,
                "threshold": similarity_threshold,
                "top_k": top_k,
            },
        )

        diary_ids_with_scores = [(row[0], row[1]) for row in result]

        if not diary_ids_with_scores:
            return []

        # 일기 객체 조회
        diary_ids = [d[0] for d in diary_ids_with_scores]
        diaries = db.query(Diary).filter(Diary.id.in_(diary_ids)).all()
        diary_map = {d.id: d for d in diaries}

        return [
            (diary_map[diary_id], score)
            for diary_id, score in diary_ids_with_scores
            if diary_id in diary_map
        ]

    @classmethod
    def delete_diary_embedding(cls, db: Session, diary_id: int) -> bool:
        """일기 임베딩 삭제"""
        result = db.query(DiaryEmbedding).filter(DiaryEmbedding.diary_id == diary_id).delete()
        db.commit()
        return result > 0
