import json
import logging
from typing import Optional, List, Dict

from sqlalchemy.orm import Session

from app.core.config import settings
from app.constants.prompts import PERSONA_GENERATION_PROMPT
from app.constants.quiz import (
    PERSONALITY_QUIZ_QUESTIONS,
    QUIZ_PERSONA_GENERATION_PROMPT,
    PERSONA_LEVELS,
    get_persona_level,
)
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User

logger = logging.getLogger(__name__)


class PersonaService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_persona(self, user: User) -> Persona:
        """사용자의 일기를 분석하여 페르소나 생성"""
        # 최근 일기 가져오기 (최대 20개)
        diaries = self.db.query(Diary).filter(
            Diary.user_id == user.id
        ).order_by(Diary.diary_date.desc()).limit(20).all()

        # 일기 내용 포맷팅
        diary_texts = []
        for d in diaries:
            diary_texts.append(
                f"[{d.diary_date}] 기분: {d.mood or '없음'}, 날씨: {d.weather or '없음'}\n"
                f"제목: {d.title}\n{d.content}\n"
            )

        diaries_formatted = "\n---\n".join(diary_texts)

        # AI로 페르소나 생성
        persona_data = await self._generate_with_ai(diaries_formatted)

        # 페르소나 저장
        persona = Persona(
            user_id=user.id,
            name=persona_data.get("name", f"{user.username}의 페르소나"),
            personality=persona_data.get("personality", ""),
            traits=json.dumps(persona_data.get("traits", []), ensure_ascii=False),
            speaking_style=persona_data.get("speaking_style", ""),
        )

        self.db.add(persona)
        self.db.commit()
        self.db.refresh(persona)

        return persona

    async def _generate_with_ai(self, diaries: str) -> dict:
        """AI를 사용하여 페르소나 데이터 생성"""
        # OpenAI API 키가 없으면 기본값 반환
        if not settings.OPENAI_API_KEY:
            return self._get_default_persona()

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = PERSONA_GENERATION_PROMPT.format(diaries=diaries)

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a persona generation expert. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            content = response.choices[0].message.content
            # JSON 파싱
            return json.loads(content)

        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return self._get_default_persona()

    def _get_default_persona(self) -> dict:
        """기본 페르소나 데이터 (AI 실패 시)"""
        return {
            "name": "나의 페르소나",
            "personality": "일기를 통해 분석된 당신만의 특별한 성격입니다. 따뜻하고 진솔한 마음을 가지고 있습니다.",
            "traits": ["따뜻함", "진솔함", "사려깊음", "성장지향", "감성적"],
            "speaking_style": "친근하고 따뜻한 말투로 대화합니다. 상대방의 감정에 공감하며 이야기를 나눕니다.",
        }

    async def generate_persona_from_quiz(
        self, user: User, quiz_answers: List[Dict]
    ) -> Persona:
        """성격 퀴즈 결과를 기반으로 임시 페르소나 생성"""
        # 퀴즈 답변에서 특성 추출
        traits = self._extract_traits_from_quiz(quiz_answers)

        # AI로 페르소나 생성
        persona_data = await self._generate_persona_from_traits(traits)

        # 페르소나 저장
        persona = Persona(
            user_id=user.id,
            name=persona_data.get("name", f"{user.username}의 페르소나"),
            personality=persona_data.get("personality", ""),
            traits=json.dumps(persona_data.get("traits", []), ensure_ascii=False),
            speaking_style=persona_data.get("speaking_style", ""),
            level="temporary",
            quiz_answers=json.dumps(quiz_answers, ensure_ascii=False),
        )

        self.db.add(persona)
        self.db.commit()
        self.db.refresh(persona)

        return persona

    def _extract_traits_from_quiz(self, quiz_answers: List[Dict]) -> List[str]:
        """퀴즈 답변에서 성격 특성 추출"""
        traits = []
        for answer in quiz_answers:
            question_id = answer["question_id"]
            option_id = answer["option_id"]

            # 해당 질문 찾기
            question = next(
                (q for q in PERSONALITY_QUIZ_QUESTIONS if q["id"] == question_id),
                None
            )
            if question:
                # 해당 선택지의 특성 찾기
                option = next(
                    (o for o in question["options"] if o["id"] == option_id),
                    None
                )
                if option:
                    traits.extend(option.get("traits", []))

        # 중복 제거하고 최대 10개까지
        unique_traits = list(dict.fromkeys(traits))
        return unique_traits[:10]

    async def _generate_persona_from_traits(self, traits: List[str]) -> dict:
        """특성 목록을 기반으로 AI 페르소나 생성"""
        if not settings.OPENAI_API_KEY:
            return self._get_default_quiz_persona(traits)

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            traits_text = ", ".join(traits)
            prompt = QUIZ_PERSONA_GENERATION_PROMPT.format(traits=traits_text)

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a persona generation expert. Always respond in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800,
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Quiz persona AI generation failed: {e}")
            return self._get_default_quiz_persona(traits)

    def _get_default_quiz_persona(self, traits: List[str]) -> dict:
        """기본 퀴즈 기반 페르소나 데이터 (AI 실패 시)"""
        selected_traits = traits[:5] if len(traits) >= 5 else traits + ["따뜻함", "성장지향", "긍정적"][:5-len(traits)]
        return {
            "name": "나의 첫 페르소나",
            "personality": f"성격 퀴즈를 통해 발견된 당신만의 특별한 성격이에요. {', '.join(selected_traits[:3])} 같은 멋진 특성을 가지고 있네요!",
            "traits": selected_traits,
            "speaking_style": "친근하고 따뜻한 말투로 대화해요. 일기를 작성하면 더 당신다운 말투로 진화할 거예요!",
        }

    async def upgrade_persona(self, user: User, new_level: str) -> Optional[Persona]:
        """페르소나 레벨 업그레이드 (일기 기반으로 재생성)"""
        persona = self.db.query(Persona).filter(Persona.user_id == user.id).first()

        if not persona:
            return None

        # 일기 개수 확인
        diary_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()

        # 레벨 업그레이드 조건 확인
        if new_level == "basic" and diary_count >= 3:
            pass
        elif new_level == "complete" and diary_count >= 7:
            pass
        else:
            return None

        # 일기 기반으로 페르소나 재생성
        diaries = self.db.query(Diary).filter(
            Diary.user_id == user.id
        ).order_by(Diary.diary_date.desc()).limit(20).all()

        diary_texts = []
        for d in diaries:
            diary_texts.append(
                f"[{d.diary_date}] 기분: {d.mood or '없음'}, 날씨: {d.weather or '없음'}\n"
                f"제목: {d.title}\n{d.content}\n"
            )

        diaries_formatted = "\n---\n".join(diary_texts)
        persona_data = await self._generate_with_ai(diaries_formatted)

        # 페르소나 업데이트
        persona.name = persona_data.get("name", persona.name)
        persona.personality = persona_data.get("personality", persona.personality)
        persona.traits = json.dumps(persona_data.get("traits", []), ensure_ascii=False)
        persona.speaking_style = persona_data.get("speaking_style", persona.speaking_style)
        persona.level = new_level

        self.db.commit()
        self.db.refresh(persona)

        return persona

    def get_persona_level_info(self, user: User) -> dict:
        """사용자의 페르소나 레벨 정보 조회"""
        persona = self.db.query(Persona).filter(Persona.user_id == user.id).first()
        diary_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()

        if not persona:
            return {
                "current_level": None,
                "level_name": "페르소나 없음",
                "description": "성격 퀴즈를 완료하면 나만의 페르소나가 생성됩니다.",
                "diary_count": diary_count,
                "next_level": "temporary",
                "next_level_name": "임시 페르소나",
                "diaries_needed": 0,
                "progress_percent": 0,
            }

        level_info = PERSONA_LEVELS.get(persona.level, PERSONA_LEVELS["complete"])
        next_level = level_info.get("next_level")
        next_level_diaries = level_info.get("next_level_diaries")

        # 진행률 계산
        if next_level_diaries:
            current_min = level_info.get("min_diaries", 0)
            progress = min(100, int((diary_count - current_min) / (next_level_diaries - current_min) * 100))
        else:
            progress = 100

        next_level_info = PERSONA_LEVELS.get(next_level) if next_level else None

        return {
            "current_level": persona.level,
            "level_name": level_info["name"],
            "description": level_info["description"],
            "diary_count": diary_count,
            "next_level": next_level,
            "next_level_name": next_level_info["name"] if next_level_info else None,
            "diaries_needed": max(0, next_level_diaries - diary_count) if next_level_diaries else None,
            "progress_percent": progress,
        }
