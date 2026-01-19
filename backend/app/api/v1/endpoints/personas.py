"""페르소나 API 엔드포인트"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.persona import (
    PersonaResponse,
    PersonaPublicResponse,
    PersonaUpdate,
    PersonaGenerateRequest,
    PersonaStatusResponse,
)
from app.services.persona_service import get_persona_service


router = APIRouter()


@router.get("/status", response_model=PersonaStatusResponse)
async def get_persona_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """페르소나 생성 가능 상태 확인"""
    service = get_persona_service(db)
    return await service.get_persona_status(current_user.id)


@router.post("/generate", response_model=PersonaResponse)
async def generate_persona(
    request: PersonaGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """페르소나 생성/재생성

    - 일기 7개 이상 필요
    - force_regenerate=True로 재생성 가능
    """
    service = get_persona_service(db)

    # 상태 확인
    status = await service.get_persona_status(current_user.id)
    if not status.can_generate:
        raise HTTPException(
            status_code=400,
            detail=status.message,
        )

    try:
        persona = await service.generate_persona(
            user_id=current_user.id,
            user_name=current_user.name,
            force_regenerate=request.force_regenerate,
        )
        return persona
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"페르소나 생성 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/me", response_model=PersonaResponse)
async def get_my_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 페르소나 조회"""
    service = get_persona_service(db)
    persona = service.get_persona_by_user_id(current_user.id)

    if not persona:
        raise HTTPException(
            status_code=404,
            detail="페르소나가 아직 생성되지 않았습니다.",
        )

    return persona


@router.put("/me", response_model=PersonaResponse)
async def update_my_persona(
    request: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 페르소나 설정 수정"""
    service = get_persona_service(db)
    persona = service.get_persona_by_user_id(current_user.id)

    if not persona:
        raise HTTPException(
            status_code=404,
            detail="페르소나가 아직 생성되지 않았습니다.",
        )

    updated_persona = service.update_persona_settings(
        persona_id=persona.id,
        name=request.name,
        is_public=request.is_public,
    )

    return updated_persona


@router.get("/{user_id}", response_model=PersonaPublicResponse)
async def get_user_persona(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """다른 사용자의 페르소나 조회 (공개된 경우만)

    Note: Phase 2에서 친구 관계 확인 로직 추가 필요
    """
    service = get_persona_service(db)
    persona = service.get_persona_by_user_id(user_id)

    if not persona:
        raise HTTPException(
            status_code=404,
            detail="해당 사용자의 페르소나가 없습니다.",
        )

    if not persona.is_public:
        raise HTTPException(
            status_code=403,
            detail="비공개 페르소나입니다.",
        )

    # TODO: Phase 2에서 친구 관계 확인 로직 추가
    # if not is_friend(current_user.id, user_id):
    #     raise HTTPException(status_code=403, detail="친구만 조회할 수 있습니다.")

    return persona
