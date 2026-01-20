import json
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.constants.prompts import PERSONA_GENERATION_PROMPT
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User


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
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = PERSONA_GENERATION_PROMPT.format(diaries=diaries)

            response = client.chat.completions.create(
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
            print(f"AI generation failed: {e}")
            return self._get_default_persona()

    def _get_default_persona(self) -> dict:
        """기본 페르소나 데이터 (AI 실패 시)"""
        return {
            "name": "나의 페르소나",
            "personality": "일기를 통해 분석된 당신만의 특별한 성격입니다. 따뜻하고 진솔한 마음을 가지고 있습니다.",
            "traits": ["따뜻함", "진솔함", "사려깊음", "성장지향", "감성적"],
            "speaking_style": "친근하고 따뜻한 말투로 대화합니다. 상대방의 감정에 공감하며 이야기를 나눕니다.",
        }
