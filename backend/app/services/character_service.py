import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.character import Character, CharacterHistory, CharacterStyle
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User

logger = logging.getLogger(__name__)

MIN_DIARIES_FOR_CHARACTER = 7
EVOLUTION_DIARY_INTERVAL = 30

STYLE_PROMPTS = {
    CharacterStyle.WATERCOLOR: "watercolor painting style, soft colors, artistic, dreamy atmosphere",
    CharacterStyle.ANIME: "anime style, vibrant colors, expressive eyes, Japanese animation aesthetic",
    CharacterStyle.PIXEL: "pixel art style, 16-bit aesthetic, retro game character",
    CharacterStyle.THREED: "3D rendered style, Pixar-like, smooth shading, detailed character",
    CharacterStyle.REALISTIC: "realistic portrait style, photorealistic, detailed features",
    CharacterStyle.CARTOON: "cartoon style, bold outlines, bright colors, playful design",
}


class CharacterService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_character(
        self,
        user: User,
        style: CharacterStyle = CharacterStyle.ANIME,
        name: Optional[str] = None,
    ) -> Character:
        """사용자의 페르소나 기반으로 캐릭터 이미지 생성"""
        # 페르소나 확인
        persona = self.db.query(Persona).filter(Persona.user_id == user.id).first()
        if not persona:
            raise ValueError("Persona not found. Generate persona first.")

        # 일기 개수 확인
        diary_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()
        if diary_count < MIN_DIARIES_FOR_CHARACTER:
            raise ValueError(f"Need at least {MIN_DIARIES_FOR_CHARACTER} diaries")

        # 캐릭터 프롬프트 생성
        prompt = self._build_character_prompt(persona, style)

        # 이미지 생성
        image_url = await self._generate_image(prompt)

        # 캐릭터 저장
        character = Character(
            user_id=user.id,
            name=name or f"{user.username}의 캐릭터",
            image_url=image_url,
            thumbnail_url=image_url,
            style=style,
            prompt_used=prompt,
            generation_count=1,
        )

        self.db.add(character)
        self.db.commit()
        self.db.refresh(character)

        # 히스토리에도 저장
        history = CharacterHistory(
            character_id=character.id,
            image_url=image_url,
            style=style,
            prompt_used=prompt,
            diary_count_at_generation=diary_count,
        )
        self.db.add(history)
        self.db.commit()

        return character

    async def change_style(
        self,
        character: Character,
        new_style: CharacterStyle,
    ) -> Character:
        """캐릭터 스타일 변경 (프리미엄 기능)"""
        persona = self.db.query(Persona).filter(
            Persona.user_id == character.user_id
        ).first()

        if not persona:
            raise ValueError("Persona not found")

        prompt = self._build_character_prompt(persona, new_style)
        image_url = await self._generate_image(prompt)

        # 캐릭터 업데이트
        character.image_url = image_url
        character.thumbnail_url = image_url
        character.style = new_style
        character.prompt_used = prompt
        character.generation_count += 1

        # 히스토리 저장
        diary_count = self.db.query(Diary).filter(
            Diary.user_id == character.user_id
        ).count()

        history = CharacterHistory(
            character_id=character.id,
            image_url=image_url,
            style=new_style,
            prompt_used=prompt,
            diary_count_at_generation=diary_count,
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(character)

        return character

    async def evolve_character(self, character: Character) -> Character:
        """캐릭터 진화 (30개 일기 단위)"""
        diary_count = self.db.query(Diary).filter(
            Diary.user_id == character.user_id
        ).count()

        # 진화 조건 확인
        expected_generation = (diary_count // EVOLUTION_DIARY_INTERVAL) + 1
        if character.generation_count >= expected_generation:
            raise ValueError("Not eligible for evolution yet")

        persona = self.db.query(Persona).filter(
            Persona.user_id == character.user_id
        ).first()

        if not persona:
            raise ValueError("Persona not found")

        prompt = self._build_character_prompt(persona, character.style, evolved=True)
        image_url = await self._generate_image(prompt)

        character.image_url = image_url
        character.thumbnail_url = image_url
        character.prompt_used = prompt
        character.generation_count += 1

        history = CharacterHistory(
            character_id=character.id,
            image_url=image_url,
            style=character.style,
            prompt_used=prompt,
            diary_count_at_generation=diary_count,
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(character)

        return character

    def _build_character_prompt(
        self,
        persona: Persona,
        style: CharacterStyle,
        evolved: bool = False,
    ) -> str:
        """캐릭터 생성용 프롬프트 빌드"""
        style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS[CharacterStyle.ANIME])

        base_prompt = (
            f"A friendly character portrait representing someone with {persona.personality}. "
            f"The character has a warm and approachable appearance. "
            f"Style: {style_prompt}. "
            f"High quality, centered composition, white background, character design."
        )

        if evolved:
            base_prompt += " More mature and refined appearance, showing growth."

        return base_prompt

    async def _generate_image(self, prompt: str) -> str:
        """DALL-E로 이미지 생성"""
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set, returning placeholder")
            return self._get_placeholder_image()

        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )

            return response.data[0].url

        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            return self._get_placeholder_image()

    def _get_placeholder_image(self) -> str:
        """플레이스홀더 이미지 URL"""
        return "https://placehold.co/512x512/6366f1/white?text=Character"

    def check_can_generate(self, user: User) -> dict:
        """캐릭터 생성 가능 상태 확인"""
        diary_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()
        character = self.db.query(Character).filter(
            Character.user_id == user.id
        ).first()

        can_generate = diary_count >= MIN_DIARIES_FOR_CHARACTER
        has_character = character is not None

        can_evolve = False
        next_evolution_at = None

        if character:
            expected_generation = (diary_count // EVOLUTION_DIARY_INTERVAL) + 1
            can_evolve = character.generation_count < expected_generation
            if not can_evolve:
                next_evolution_at = (character.generation_count * EVOLUTION_DIARY_INTERVAL) - diary_count + EVOLUTION_DIARY_INTERVAL

        return {
            "can_generate": can_generate and not has_character,
            "has_character": has_character,
            "diary_count": diary_count,
            "required_diary_count": MIN_DIARIES_FOR_CHARACTER,
            "can_evolve": can_evolve,
            "next_evolution_at": next_evolution_at,
        }
