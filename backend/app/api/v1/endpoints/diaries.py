from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.diary import (
    DiaryCreate,
    DiaryUpdate,
    DiaryResponse,
    DiaryListResponse,
    DiaryStatsResponse
)
from app.services.diary_service import DiaryService

router = APIRouter()


@router.post("", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
def create_diary(
    diary_data: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """새 일기 작성"""
    return DiaryService.create_diary(db, current_user.id, diary_data)


@router.get("", response_model=DiaryListResponse)
def get_diaries(
    year: Optional[int] = Query(None, ge=2000, le=2100),
    month: Optional[int] = Query(None, ge=1, le=12),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일기 목록 조회"""
    diaries, total = DiaryService.get_diaries(
        db, current_user.id, year, month, page, limit
    )

    return DiaryListResponse(
        items=diaries,
        total=total,
        page=page,
        limit=limit,
        has_next=(page * limit) < total
    )


@router.get("/stats", response_model=DiaryStatsResponse)
def get_diary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일기 통계 조회"""
    stats = DiaryService.get_diary_stats(db, current_user.id)
    return DiaryStatsResponse(**stats)


@router.get("/date/{diary_date}", response_model=DiaryResponse)
def get_diary_by_date(
    diary_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 날짜의 일기 조회"""
    diary = DiaryService.get_diary_by_date(db, current_user.id, diary_date)
    if not diary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 날짜에 일기가 없습니다."
        )
    return diary


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일기 상세 조회"""
    return DiaryService.get_diary_by_id(db, diary_id, current_user.id)


@router.put("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: int,
    diary_data: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일기 수정"""
    return DiaryService.update_diary(db, diary_id, current_user.id, diary_data)


@router.delete("/{diary_id}")
def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일기 삭제"""
    DiaryService.delete_diary(db, diary_id, current_user.id)
    return {"success": True, "message": "일기가 삭제되었습니다."}
