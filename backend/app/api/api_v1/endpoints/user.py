from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """현재 로그인한 사용자 정보 조회"""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 사용자 정보 수정"""
    if user_update.username:
        # 사용자명 중복 체크
        existing = db.query(User).filter(
            User.username == user_update.username,
            User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        current_user.username = user_update.username

    if user_update.profile_image is not None:
        current_user.profile_image = user_update.profile_image

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """특정 사용자 정보 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/search/{username}", response_model=list[UserResponse])
def search_users(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """사용자명으로 사용자 검색"""
    users = db.query(User).filter(
        User.username.ilike(f"%{username}%"),
        User.id != current_user.id,
        User.is_active.is_(True),
    ).limit(20).all()

    return users
