"""페르소나 서비스 - 페르소나 생성 및 관리"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Session

from app.services.llm import (
    get_llm_client,
    PERSONA_GENERATION_SYSTEM,
    PERSONA_GENERATION_USER,
    format_diaries_for_prompt,
)
from app.schemas.persona import PersonaGenerationResult, PersonaStatusResponse


# 페르소나 생성에 필요한 최소 일기 수
MIN_DIARIES_FOR_PERSONA = 7


class PersonaService:
    """페르소나 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_client()

    async def get_persona_status(self, user_id: int) -> PersonaStatusResponse:
        """페르소나 생성 가능 상태 확인"""
        from app.models.diary import Diary
        from app.models.persona import Persona

        # 비공개가 아닌 일기 수 조회
        diary_count = (
            self.db.query(Diary)
            .filter(
                Diary.user_id == user_id,
                Diary.is_private == False,
            )
            .count()
        )

        # 기존 페르소나 존재 여부
        persona = self.db.query(Persona).filter(Persona.user_id == user_id).first()

        can_generate = diary_count >= MIN_DIARIES_FOR_PERSONA

        if persona:
            message = "페르소나가 이미 생성되어 있습니다. 재생성할 수 있습니다."
        elif can_generate:
            message = "페르소나를 생성할 수 있습니다!"
        else:
            remaining = MIN_DIARIES_FOR_PERSONA - diary_count
            message = f"페르소나 생성까지 일기 {remaining}개가 더 필요합니다."

        return PersonaStatusResponse(
            can_generate=can_generate,
            diary_count=diary_count,
            required_count=MIN_DIARIES_FOR_PERSONA,
            has_persona=persona is not None,
            message=message,
        )

    async def generate_persona(
        self,
        user_id: int,
        user_name: str,
        force_regenerate: bool = False,
    ) -> "Persona":
        """페르소나 생성/재생성"""
        from app.models.diary import Diary
        from app.models.persona import Persona

        # 기존 페르소나 확인
        existing_persona = (
            self.db.query(Persona).filter(Persona.user_id == user_id).first()
        )

        if existing_persona and not force_regenerate:
            return existing_persona

        # 비공개가 아닌 일기 조회
        diaries = (
            self.db.query(Diary)
            .filter(
                Diary.user_id == user_id,
                Diary.is_private == False,
            )
            .order_by(Diary.date.desc())
            .all()
        )

        if len(diaries) < MIN_DIARIES_FOR_PERSONA:
            raise ValueError(
                f"페르소나 생성에 최소 {MIN_DIARIES_FOR_PERSONA}개의 일기가 필요합니다. "
                f"현재: {len(diaries)}개"
            )

        # LLM으로 페르소나 생성
        result = await self._generate_persona_with_llm(user_name, diaries)

        if existing_persona:
            # 기존 페르소나 업데이트
            existing_persona.personality = result.personality
            existing_persona.traits = result.traits
            existing_persona.speaking_style = result.speaking_style
            existing_persona.summary = result.summary
            existing_persona.interests = result.interests
            existing_persona.last_updated = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing_persona)
            return existing_persona
        else:
            # 새 페르소나 생성
            persona = Persona(
                user_id=user_id,
                name=f"{user_name}의 분신",
                personality=result.personality,
                traits=result.traits,
                speaking_style=result.speaking_style,
                summary=result.summary,
                interests=result.interests,
                is_public=True,
            )
            self.db.add(persona)
            self.db.commit()
            self.db.refresh(persona)
            return persona

    async def _generate_persona_with_llm(
        self,
        user_name: str,
        diaries: List,
    ) -> PersonaGenerationResult:
        """LLM을 사용하여 페르소나 생성"""
        formatted_diaries = format_diaries_for_prompt(diaries)

        user_prompt = PERSONA_GENERATION_USER.format(
            user_name=user_name,
            diaries=formatted_diaries,
        )

        result = await self.llm.generate_json(
            system_prompt=PERSONA_GENERATION_SYSTEM,
            user_prompt=user_prompt,
        )

        return PersonaGenerationResult(
            personality=result.get("personality", ""),
            traits=result.get("traits", [])[:5],  # 최대 5개
            speaking_style=result.get("speaking_style", ""),
            summary=result.get("summary", ""),
            interests=result.get("interests", [])[:5],  # 최대 5개
        )

    def get_persona_by_user_id(self, user_id: int) -> Optional["Persona"]:
        """사용자 ID로 페르소나 조회"""
        from app.models.persona import Persona

        return self.db.query(Persona).filter(Persona.user_id == user_id).first()

    def get_persona_by_id(self, persona_id: int) -> Optional["Persona"]:
        """페르소나 ID로 조회"""
        from app.models.persona import Persona

        return self.db.query(Persona).filter(Persona.id == persona_id).first()

    def update_persona_settings(
        self,
        persona_id: int,
        name: Optional[str] = None,
        is_public: Optional[bool] = None,
    ) -> Optional["Persona"]:
        """페르소나 설정 업데이트"""
        from app.models.persona import Persona

        persona = self.get_persona_by_id(persona_id)
        if not persona:
            return None

        if name is not None:
            persona.name = name
        if is_public is not None:
            persona.is_public = is_public

        self.db.commit()
        self.db.refresh(persona)
        return persona


def get_persona_service(db: Session) -> PersonaService:
    """PersonaService 인스턴스 반환"""
    return PersonaService(db)
