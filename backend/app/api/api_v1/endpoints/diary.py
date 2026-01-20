from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.diary import Diary
from app.models.user import User
from app.schemas.diary import DiaryCreate, DiaryResponse, DiaryUpdate, DiaryListResponse

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

    db.delete(diary)
    db.commit()
