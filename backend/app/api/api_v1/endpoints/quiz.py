import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.core.business_logger import biz_log
from app.constants.quiz import PERSONALITY_QUIZ_QUESTIONS, PERSONA_LEVELS
from app.models.persona import Persona
from app.models.user import User
from app.schemas.quiz import (
    QuizQuestionsResponse,
    QuizQuestion,
    QuizOption,
    QuizSubmitRequest,
    QuizSubmitResponse,
    PersonaLevelInfo,
)
from app.services.persona_service import PersonaService
from app.services.milestone_service import MilestoneService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/questions", response_model=QuizQuestionsResponse)
def get_quiz_questions(
    current_user: User = Depends(get_current_active_user),
):
    """성격 퀴즈 질문 목록 조회"""
    questions = []
    for q in PERSONALITY_QUIZ_QUESTIONS:
        options = [
            QuizOption(id=opt["id"], text=opt["text"])
            for opt in q["options"]
        ]
        questions.append(QuizQuestion(
            id=q["id"],
            question=q["question"],
            options=options
        ))

    return QuizQuestionsResponse(
        questions=questions,
        total_questions=len(questions)
    )


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """성격 퀴즈 제출 및 임시 페르소나 생성"""
    # 이미 페르소나가 있는지 확인
    existing_persona = db.query(Persona).filter(
        Persona.user_id == current_user.id
    ).first()

    if existing_persona:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a persona. Use regenerate endpoint to update.",
        )

    # 답변 유효성 검증
    question_ids = set()
    for answer in request.answers:
        if answer.question_id in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate answer for question {answer.question_id}",
            )
        question_ids.add(answer.question_id)

        # 질문 ID 범위 확인
        if answer.question_id < 1 or answer.question_id > len(PERSONALITY_QUIZ_QUESTIONS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question ID: {answer.question_id}",
            )

    # 퀴즈 기반 페르소나 생성
    answers_list = [
        {"question_id": a.question_id, "option_id": a.option_id}
        for a in request.answers
    ]

    try:
        persona_service = PersonaService(db)
        persona = await persona_service.generate_persona_from_quiz(
            current_user, answers_list
        )

        logger.info(f"Quiz persona created for user {current_user.username}")

        return QuizSubmitResponse(
            success=True,
            persona_id=persona.id,
            persona_name=persona.name,
            persona_level="temporary",
            message="임시 페르소나가 생성되었어요! 일기를 작성하면 더 나다운 페르소나로 진화해요.",
        )

    except Exception as e:
        logger.error(f"Quiz persona generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate persona. Please try again.",
        )


@router.get("/persona-level", response_model=PersonaLevelInfo)
def get_persona_level(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """현재 사용자의 페르소나 레벨 정보 조회"""
    persona_service = PersonaService(db)
    level_info = persona_service.get_persona_level_info(current_user)
    return level_info


@router.post("/upgrade-persona")
async def upgrade_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """페르소나 레벨 업그레이드 (일기 기반으로 재생성)"""
    persona_service = PersonaService(db)
    level_info = persona_service.get_persona_level_info(current_user)

    if not level_info["current_level"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No persona found. Complete the quiz first.",
        )

    next_level = level_info["next_level"]
    if not next_level:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your persona is already at the highest level.",
        )

    if level_info["diaries_needed"] and level_info["diaries_needed"] > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Write {level_info['diaries_needed']} more diaries to upgrade.",
        )

    # 페르소나 업그레이드
    try:
        upgraded_persona = await persona_service.upgrade_persona(
            current_user, next_level
        )

        if not upgraded_persona:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to upgrade persona.",
            )

        # Create upgrade notification
        milestone_service = MilestoneService(db)
        milestone_service.create_upgrade_notification(current_user, next_level)

        next_level_info = PERSONA_LEVELS.get(next_level, {})

        return {
            "success": True,
            "new_level": next_level,
            "level_name": next_level_info.get("name", ""),
            "message": f"페르소나가 '{next_level_info.get('name', '')}'(으)로 진화했어요!",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Persona upgrade failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade persona. Please try again.",
        )
