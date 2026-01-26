import json
import logging
from datetime import date, timedelta
from typing import Optional
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.business_logger import biz_log
from app.models.diary import Diary
from app.models.user import User
from app.schemas.diary import DiaryCreate, DiaryResponse, DiaryUpdate, DiaryListResponse, DiaryStats, DiaryPromptSuggestionResponse
from app.constants.prompts import DIARY_PROMPT_SUGGESTION

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
def create_diary(
    diary_in: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """일기 작성"""
    # 같은 날짜에 이미 일기가 있는지 확인
    existing = db.query(Diary).filter(
        Diary.user_id == current_user.id,
        Diary.diary_date == diary_in.diary_date,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diary already exists for this date",
        )

    diary = Diary(
        user_id=current_user.id,
        title=diary_in.title,
        content=diary_in.content,
        mood=diary_in.mood,
        weather=diary_in.weather,
        diary_date=diary_in.diary_date,
    )
    db.add(diary)
    db.commit()
    db.refresh(diary)

    biz_log.diary_create(current_user.username, str(diary_in.diary_date), diary_in.mood)
    return diary


@router.get("", response_model=DiaryListResponse)
def get_diaries(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    mood: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 일기 목록 조회"""
    query = db.query(Diary).filter(Diary.user_id == current_user.id)

    if mood:
        query = query.filter(Diary.mood == mood)

    total = query.count()
    diaries = query.order_by(Diary.diary_date.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return DiaryListResponse(
        items=diaries,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/count")
def get_diary_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 일기 개수 조회"""
    count = db.query(Diary).filter(Diary.user_id == current_user.id).count()
    return {"count": count}


@router.get("/stats", response_model=DiaryStats)
def get_diary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """일기 통계 조회"""
    # Get all diaries for the user
    diaries = db.query(Diary).filter(
        Diary.user_id == current_user.id
    ).order_by(Diary.diary_date.desc()).all()

    total_count = len(diaries)

    if total_count == 0:
        return DiaryStats(
            total_count=0,
            current_streak=0,
            longest_streak=0,
            mood_distribution={},
            monthly_count={},
            weekly_average=0.0,
        )

    # Calculate streaks
    diary_dates = sorted([d.diary_date for d in diaries], reverse=True)
    today = date.today()

    # Current streak (consecutive days from today or yesterday)
    current_streak = 0
    check_date = today

    # If there's no diary today, check from yesterday
    if diary_dates[0] < today:
        check_date = today - timedelta(days=1)

    for diary_date in diary_dates:
        if diary_date == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        elif diary_date < check_date:
            break

    # Longest streak
    longest_streak = 0
    streak = 0
    prev_date = None

    for diary_date in sorted(diary_dates):
        if prev_date is None:
            streak = 1
        elif diary_date == prev_date + timedelta(days=1):
            streak += 1
        else:
            longest_streak = max(longest_streak, streak)
            streak = 1
        prev_date = diary_date

    longest_streak = max(longest_streak, streak)

    # Mood distribution
    mood_distribution: dict[str, int] = defaultdict(int)
    for diary in diaries:
        if diary.mood:
            mood_distribution[diary.mood] += 1

    # Monthly count (last 12 months)
    monthly_count: dict[str, int] = defaultdict(int)
    for diary in diaries:
        month_key = diary.diary_date.strftime("%Y-%m")
        monthly_count[month_key] += 1

    # Keep only last 12 months and sort
    sorted_months = sorted(monthly_count.keys(), reverse=True)[:12]
    monthly_count = {k: monthly_count[k] for k in sorted(sorted_months)}

    # Weekly average (based on all diaries)
    if total_count > 0:
        first_date = min(diary_dates)
        last_date = max(diary_dates)
        total_days = (last_date - first_date).days + 1
        weeks = max(total_days / 7, 1)
        weekly_average = round(total_count / weeks, 1)
    else:
        weekly_average = 0.0

    return DiaryStats(
        total_count=total_count,
        current_streak=current_streak,
        longest_streak=longest_streak,
        mood_distribution=dict(mood_distribution),
        monthly_count=monthly_count,
        weekly_average=weekly_average,
    )


@router.get("/prompt-suggestions", response_model=DiaryPromptSuggestionResponse)
async def get_prompt_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """AI 기반 일기 주제 제안"""
    # Get recent diaries (last 5)
    recent_diaries = db.query(Diary).filter(
        Diary.user_id == current_user.id
    ).order_by(Diary.diary_date.desc()).limit(5).all()

    # Format recent diaries for prompt
    if recent_diaries:
        diary_summaries = []
        for d in recent_diaries:
            diary_summaries.append(
                f"- [{d.diary_date}] {d.title} (기분: {d.mood or '없음'})"
            )
        recent_diaries_text = "\n".join(diary_summaries)
    else:
        recent_diaries_text = "아직 작성된 일기가 없습니다."

    today_str = date.today().strftime("%Y년 %m월 %d일")

    # Check if OpenAI API key is available
    if not settings.OPENAI_API_KEY:
        # Return default suggestions
        return DiaryPromptSuggestionResponse(
            prompts=[
                {"title": "오늘 하루 돌아보기", "description": "오늘 하루는 어땠나요? 기억에 남는 순간을 적어보세요."},
                {"title": "감사한 것 세 가지", "description": "오늘 감사했던 것 세 가지를 떠올려 보세요."},
                {"title": "내일의 나에게", "description": "내일의 나에게 하고 싶은 말이 있다면 적어보세요."},
            ]
        )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        prompt = DIARY_PROMPT_SUGGESTION.format(
            today=today_str,
            recent_diaries=recent_diaries_text
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful diary writing assistant. Always respond in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=500,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        return DiaryPromptSuggestionResponse(prompts=result.get("prompts", []))

    except Exception as e:
        logger.error(f"Failed to generate prompt suggestions: {e}")
        # Return default suggestions on error
        return DiaryPromptSuggestionResponse(
            prompts=[
                {"title": "오늘 하루 돌아보기", "description": "오늘 하루는 어땠나요? 기억에 남는 순간을 적어보세요."},
                {"title": "감사한 것 세 가지", "description": "오늘 감사했던 것 세 가지를 떠올려 보세요."},
                {"title": "내일의 나에게", "description": "내일의 나에게 하고 싶은 말이 있다면 적어보세요."},
            ]
        )


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """일기 상세 조회"""
    diary = db.query(Diary).filter(
        Diary.id == diary_id,
        Diary.user_id == current_user.id,
    ).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary not found",
        )

    return diary


@router.patch("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: int,
    diary_update: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """일기 수정"""
    diary = db.query(Diary).filter(
        Diary.id == diary_id,
        Diary.user_id == current_user.id,
    ).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary not found",
        )

    update_data = diary_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(diary, field, value)

    db.commit()
    db.refresh(diary)

    biz_log.diary_update(current_user.username, diary_id)
    return diary


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """일기 삭제"""
    diary = db.query(Diary).filter(
        Diary.id == diary_id,
        Diary.user_id == current_user.id,
    ).first()

    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diary not found",
        )

    biz_log.diary_delete(current_user.username, diary_id)
    db.delete(diary)
    db.commit()
