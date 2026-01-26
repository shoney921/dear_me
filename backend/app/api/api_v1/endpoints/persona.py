import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_active_user
from app.core.business_logger import biz_log
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.schemas.persona import (
    PersonaResponse,
    PersonaGenerateResponse,
    PersonaUpdateRequest,
    PersonaCustomizeRequest,
    PersonaCustomizeResponse,
    PersonaCustomization,
)
from app.services.persona_service import PersonaService

router = APIRouter()

MIN_DIARIES_FOR_PERSONA = 7


def _parse_persona_response(persona: Persona) -> dict:
    """페르소나 응답 데이터 파싱 헬퍼"""
    data = {
        "id": persona.id,
        "user_id": persona.user_id,
        "name": persona.name,
        "personality": persona.personality,
        "traits": json.loads(persona.traits) if persona.traits else None,
        "speaking_style": persona.speaking_style,
        "avatar_url": persona.avatar_url,
        "is_public": persona.is_public if persona.is_public is not None else True,
        "customization": json.loads(persona.customization) if persona.customization else None,
        "level": persona.level or "complete",
        "created_at": persona.created_at,
        "updated_at": persona.updated_at,
    }
    return data


@router.get("/me", response_model=PersonaResponse)
def get_my_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 페르소나 조회"""
    persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()

    if not persona:
        biz_log.persona_get_me(current_user.username, False)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found. Write at least 7 diaries to generate your persona.",
        )

    biz_log.persona_get_me(current_user.username, True)
    return _parse_persona_response(persona)


@router.put("/me", response_model=PersonaResponse)
def update_my_persona(
    request: PersonaUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 페르소나 설정 수정 (이름, 공개 여부)"""
    persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found.",
        )

    # 수정할 필드만 업데이트
    if request.name is not None:
        persona.name = request.name
    if request.is_public is not None:
        persona.is_public = request.is_public

    db.commit()
    db.refresh(persona)

    biz_log.persona_update(current_user.username)
    return _parse_persona_response(persona)


@router.put("/me/customize", response_model=PersonaCustomizeResponse)
def customize_my_persona(
    request: PersonaCustomizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 페르소나 커스터마이징 (말투, 성격 등 세부 조정)"""
    persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found.",
        )

    # 기존 커스터마이징 설정 로드
    existing_customization = {}
    if persona.customization:
        try:
            existing_customization = json.loads(persona.customization)
        except json.JSONDecodeError:
            existing_customization = {}

    # 요청된 필드만 업데이트
    if request.speaking_style_tone is not None:
        existing_customization["speaking_style_tone"] = request.speaking_style_tone
    if request.speaking_style_emoji is not None:
        existing_customization["speaking_style_emoji"] = request.speaking_style_emoji
    if request.personality_traits_override is not None:
        existing_customization["personality_traits_override"] = request.personality_traits_override
    if request.custom_greeting is not None:
        existing_customization["custom_greeting"] = request.custom_greeting

    persona.customization = json.dumps(existing_customization, ensure_ascii=False)
    db.commit()
    db.refresh(persona)

    biz_log.persona_customize(current_user.username)
    return {
        "id": persona.id,
        "customization": existing_customization,
        "updated_at": persona.updated_at,
    }


@router.post("/generate", response_model=PersonaGenerateResponse)
async def generate_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """페르소나 생성 (일기 7개 이상 필요)"""
    # 일기 개수 확인
    diary_count = db.query(Diary).filter(Diary.user_id == current_user.id).count()

    if diary_count < MIN_DIARIES_FOR_PERSONA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You need at least {MIN_DIARIES_FOR_PERSONA} diaries to generate a persona. Current: {diary_count}",
        )

    # 이미 페르소나가 있는지 확인
    existing_persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()
    if existing_persona:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Persona already exists. Use regenerate endpoint to update.",
        )

    # 페르소나 생성
    biz_log.persona_generate(current_user.username, diary_count)
    persona_service = PersonaService(db)
    persona = await persona_service.generate_persona(current_user)

    biz_log.persona_generated(current_user.username, persona.name)
    return PersonaGenerateResponse(
        persona=persona,
        message="Persona generated successfully!",
    )


@router.post("/regenerate", response_model=PersonaGenerateResponse)
async def regenerate_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """페르소나 재생성"""
    # 일기 개수 확인
    diary_count = db.query(Diary).filter(Diary.user_id == current_user.id).count()

    if diary_count < MIN_DIARIES_FOR_PERSONA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You need at least {MIN_DIARIES_FOR_PERSONA} diaries. Current: {diary_count}",
        )

    # 기존 페르소나 삭제
    existing_persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()
    if existing_persona:
        db.delete(existing_persona)
        db.commit()

    # 페르소나 재생성
    biz_log.persona_regenerate(current_user.username)
    persona_service = PersonaService(db)
    persona = await persona_service.generate_persona(current_user)

    biz_log.persona_generated(current_user.username, persona.name)
    return PersonaGenerateResponse(
        persona=persona,
        message="Persona regenerated successfully!",
    )


@router.get("/status")
def get_persona_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """페르소나 생성 가능 상태 확인"""
    diary_count = db.query(Diary).filter(Diary.user_id == current_user.id).count()
    has_persona = db.query(Persona).filter(Persona.user_id == current_user.id).first() is not None
    can_generate = diary_count >= MIN_DIARIES_FOR_PERSONA

    biz_log.persona_status(current_user.username, can_generate, diary_count)
    return {
        "diary_count": diary_count,
        "required_count": MIN_DIARIES_FOR_PERSONA,
        "can_generate": can_generate,
        "has_persona": has_persona,
    }


@router.get("/{user_id}", response_model=PersonaResponse)
def get_user_persona(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """특정 사용자의 페르소나 조회 (친구만 가능)"""
    # 자기 자신의 페르소나는 /me 엔드포인트 사용
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /personas/me endpoint for your own persona",
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
            detail="You can only view persona of your friends",
        )

    persona = db.query(Persona).filter(Persona.user_id == user_id).first()

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend does not have a persona yet",
        )

    # 비공개 페르소나 접근 제한
    if persona.is_public is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This persona is private",
        )

    # 친구 이름 조회
    friend = db.query(User).filter(User.id == user_id).first()
    friend_name = friend.username if friend else "Unknown"
    biz_log.persona_get_friend(current_user.username, friend_name)

    return _parse_persona_response(persona)
