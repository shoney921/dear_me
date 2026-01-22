from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_active_user, check_premium_subscription, require_premium
from app.models.user import User
from app.models.character import Character, CharacterStyle
from app.models.friendship import Friendship, FriendshipStatus
from app.schemas.character import (
    CharacterResponse,
    CharacterWithHistory,
    CharacterGenerateRequest,
    CharacterStyleChangeRequest,
    CharacterGenerationStatus,
)
from app.services.character_service import CharacterService

router = APIRouter()


@router.get("/me", response_model=CharacterResponse)
def get_my_character(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 캐릭터 조회"""
    character = db.query(Character).filter(
        Character.user_id == current_user.id
    ).first()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found. Generate your character first.",
        )

    return character


@router.get("/me/history", response_model=CharacterWithHistory)
def get_my_character_with_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 캐릭터 + 진화 히스토리 조회"""
    character = db.query(Character).filter(
        Character.user_id == current_user.id
    ).first()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found.",
        )

    return character


@router.get("/status", response_model=CharacterGenerationStatus)
def get_character_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """캐릭터 생성 가능 상태 확인"""
    service = CharacterService(db)
    status_data = service.check_can_generate(current_user)
    return CharacterGenerationStatus(**status_data)


@router.get("/styles")
def get_available_styles(
    is_premium: bool = Depends(check_premium_subscription),
):
    """이용 가능한 스타일 목록"""
    styles = []
    for style in CharacterStyle:
        styles.append({
            "value": style.value,
            "name": _get_style_name(style),
            "is_premium": style != CharacterStyle.ANIME,
            "available": is_premium or style == CharacterStyle.ANIME,
        })
    return styles


@router.post("/generate", response_model=CharacterResponse)
async def generate_character(
    request: CharacterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    is_premium: bool = Depends(check_premium_subscription),
):
    """캐릭터 생성"""
    # 이미 캐릭터가 있는지 확인
    existing = db.query(Character).filter(
        Character.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Character already exists. Use style change or evolution.",
        )

    # 무료 유저는 anime 스타일만 사용 가능
    if not is_premium and request.style != CharacterStyle.ANIME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required for this style",
        )

    try:
        service = CharacterService(db)
        character = await service.generate_character(
            user=current_user,
            style=request.style,
            name=request.name,
        )
        return character
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/me/style", response_model=CharacterResponse)
async def change_character_style(
    request: CharacterStyleChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(require_premium),
):
    """캐릭터 스타일 변경 (프리미엄 전용)"""
    character = db.query(Character).filter(
        Character.user_id == current_user.id
    ).first()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found.",
        )

    try:
        service = CharacterService(db)
        updated = await service.change_style(character, request.style)
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/me/evolve", response_model=CharacterResponse)
async def evolve_character(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """캐릭터 진화"""
    character = db.query(Character).filter(
        Character.user_id == current_user.id
    ).first()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found.",
        )

    try:
        service = CharacterService(db)
        evolved = await service.evolve_character(character)
        return evolved
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{user_id}", response_model=CharacterResponse)
def get_friend_character(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 캐릭터 조회"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /characters/me endpoint for your own character",
        )

    # 친구 관계 확인
    friendship = db.query(Friendship).filter(
        or_(
            and_(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == user_id,
            ),
            and_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == current_user.id,
            ),
        ),
        Friendship.status == FriendshipStatus.ACCEPTED,
    ).first()

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view characters of your friends",
        )

    character = db.query(Character).filter(Character.user_id == user_id).first()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend does not have a character yet",
        )

    return character


def _get_style_name(style: CharacterStyle) -> str:
    """스타일 한글 이름"""
    names = {
        CharacterStyle.WATERCOLOR: "수채화",
        CharacterStyle.ANIME: "애니메이션",
        CharacterStyle.PIXEL: "픽셀 아트",
        CharacterStyle.THREED: "3D",
        CharacterStyle.REALISTIC: "실사",
        CharacterStyle.CARTOON: "카툰",
    }
    return names.get(style, style.value)
