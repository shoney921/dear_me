from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User
from app.schemas.persona import PersonaResponse, PersonaGenerateResponse
from app.services.persona_service import PersonaService

router = APIRouter()

MIN_DIARIES_FOR_PERSONA = 7


@router.get("/me", response_model=PersonaResponse)
def get_my_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 페르소나 조회"""
    persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found. Write at least 7 diaries to generate your persona.",
        )

    return persona


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
    persona_service = PersonaService(db)
    persona = await persona_service.generate_persona(current_user)

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
    persona_service = PersonaService(db)
    persona = await persona_service.generate_persona(current_user)

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

    return {
        "diary_count": diary_count,
        "required_count": MIN_DIARIES_FOR_PERSONA,
        "can_generate": diary_count >= MIN_DIARIES_FOR_PERSONA,
        "has_persona": has_persona,
    }


@router.get("/{user_id}", response_model=PersonaResponse)
def get_user_persona(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """특정 사용자의 페르소나 조회 (친구만 가능)"""
    # TODO: 친구 관계 확인 로직 추가
    persona = db.query(Persona).filter(Persona.user_id == user_id).first()

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found",
        )

    return persona
