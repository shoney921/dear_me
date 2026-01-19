from datetime import date, datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from fastapi import HTTPException, status

from app.models.diary import Diary
from app.schemas.diary import DiaryCreate, DiaryUpdate


class DiaryService:
    @staticmethod
    def create_diary(db: Session, user_id: int, diary_data: DiaryCreate) -> Diary:
        """새 일기 작성"""
        diary_date = diary_data.date or date.today()

        # 같은 날짜에 이미 일기가 있는지 확인
        existing = db.query(Diary).filter(
            and_(Diary.user_id == user_id, Diary.date == diary_date)
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 해당 날짜에 일기가 존재합니다."
            )

        diary = Diary(
            user_id=user_id,
            content=diary_data.content,
            mood=diary_data.mood,
            weather=diary_data.weather,
            is_private=diary_data.is_private,
            date=diary_date
        )

        db.add(diary)
        db.commit()
        db.refresh(diary)
        return diary

    @staticmethod
    def get_diary_by_id(db: Session, diary_id: int, user_id: int) -> Diary:
        """ID로 일기 조회"""
        diary = db.query(Diary).filter(
            and_(Diary.id == diary_id, Diary.user_id == user_id)
        ).first()

        if not diary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="일기를 찾을 수 없습니다."
            )

        return diary

    @staticmethod
    def get_diary_by_date(db: Session, user_id: int, diary_date: date) -> Optional[Diary]:
        """특정 날짜의 일기 조회"""
        return db.query(Diary).filter(
            and_(Diary.user_id == user_id, Diary.date == diary_date)
        ).first()

    @staticmethod
    def get_diaries(
        db: Session,
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Diary], int]:
        """일기 목록 조회"""
        query = db.query(Diary).filter(Diary.user_id == user_id)

        if year and month:
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month + 1, 1)
            query = query.filter(and_(Diary.date >= start_date, Diary.date < end_date))
        elif year:
            start_date = date(year, 1, 1)
            end_date = date(year + 1, 1, 1)
            query = query.filter(and_(Diary.date >= start_date, Diary.date < end_date))

        total = query.count()

        diaries = query.order_by(desc(Diary.date)).offset((page - 1) * limit).limit(limit).all()

        return diaries, total

    @staticmethod
    def update_diary(db: Session, diary_id: int, user_id: int, diary_data: DiaryUpdate) -> Diary:
        """일기 수정"""
        diary = DiaryService.get_diary_by_id(db, diary_id, user_id)

        update_data = diary_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(diary, field, value)

        diary.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(diary)
        return diary

    @staticmethod
    def delete_diary(db: Session, diary_id: int, user_id: int) -> bool:
        """일기 삭제"""
        diary = DiaryService.get_diary_by_id(db, diary_id, user_id)

        db.delete(diary)
        db.commit()
        return True

    @staticmethod
    def get_diary_count(db: Session, user_id: int, exclude_private: bool = False) -> int:
        """일기 개수 조회"""
        query = db.query(Diary).filter(Diary.user_id == user_id)

        if exclude_private:
            query = query.filter(Diary.is_private == False)

        return query.count()

    @staticmethod
    def get_diary_stats(db: Session, user_id: int) -> dict:
        """일기 통계 조회"""
        # 전체 일기 수
        total = db.query(Diary).filter(Diary.user_id == user_id).count()

        # 이번 달 일기 수
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        this_month_count = db.query(Diary).filter(
            and_(
                Diary.user_id == user_id,
                Diary.date >= start_of_month
            )
        ).count()

        # 기분별 통계
        mood_stats = db.query(
            Diary.mood,
            func.count(Diary.id)
        ).filter(
            and_(Diary.user_id == user_id, Diary.mood.isnot(None))
        ).group_by(Diary.mood).all()

        moods = {mood: count for mood, count in mood_stats}

        # 연속 작성일 계산
        streak = DiaryService._calculate_streak(db, user_id)

        return {
            "total": total,
            "streak": streak,
            "moods": moods,
            "this_month_count": this_month_count
        }

    @staticmethod
    def _calculate_streak(db: Session, user_id: int) -> int:
        """연속 작성일 계산"""
        diaries = db.query(Diary.date).filter(
            Diary.user_id == user_id
        ).order_by(desc(Diary.date)).all()

        if not diaries:
            return 0

        dates = [d[0] for d in diaries]
        today = date.today()

        # 오늘 또는 어제부터 시작
        if dates[0] != today and dates[0] != today.replace(day=today.day - 1 if today.day > 1 else today.day):
            # 최근 일기가 오늘이나 어제가 아니면 streak = 0
            if (today - dates[0]).days > 1:
                return 0

        streak = 1
        for i in range(len(dates) - 1):
            diff = (dates[i] - dates[i + 1]).days
            if diff == 1:
                streak += 1
            else:
                break

        return streak

    @staticmethod
    def get_diaries_for_persona(db: Session, user_id: int, limit: int = 50) -> List[Diary]:
        """페르소나 생성용 일기 조회 (비공개 제외)"""
        return db.query(Diary).filter(
            and_(
                Diary.user_id == user_id,
                Diary.is_private == False
            )
        ).order_by(desc(Diary.date)).limit(limit).all()
