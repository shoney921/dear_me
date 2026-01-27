import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.constants.prompts import (
    PERSONA_CHAT_PROMPT,
    FRIEND_PERSONA_CHAT_PROMPT,
    TEMPORARY_PERSONA_CHAT_PROMPT,
)
from app.models.chat import PersonaChat, ChatMessage
from app.models.persona import Persona

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: Session):
        self.db = db

    async def send_message(self, chat: PersonaChat, content: str) -> ChatMessage:
        """메시지 전송 및 AI 응답 생성"""
        # 사용자 메시지 저장
        user_message = ChatMessage(
            chat_id=chat.id,
            content=content,
            is_user=True,
        )
        self.db.add(user_message)
        self.db.commit()

        # 페르소나 정보 가져오기
        persona = self.db.query(Persona).filter(Persona.id == chat.persona_id).first()

        if not persona:
            logger.error(f"Persona not found for chat {chat.id}")
            # 기본 응답 반환
            ai_message = ChatMessage(
                chat_id=chat.id,
                content="페르소나를 찾을 수 없어요. 나중에 다시 시도해주세요!",
                is_user=False,
            )
            self.db.add(ai_message)
            self.db.commit()
            self.db.refresh(ai_message)
            return ai_message

        # 이전 대화 내역 가져오기 (최근 10개)
        previous_messages = self.db.query(ChatMessage).filter(
            ChatMessage.chat_id == chat.id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()

        # AI 응답 생성
        ai_response = await self._generate_response(
            persona=persona,
            user_message=content,
            chat_history=list(reversed(previous_messages)),
            is_own_persona=chat.is_own_persona,
        )

        # AI 응답 저장
        ai_message = ChatMessage(
            chat_id=chat.id,
            content=ai_response,
            is_user=False,
        )
        self.db.add(ai_message)
        self.db.commit()
        self.db.refresh(ai_message)

        return ai_message

    async def _generate_response(
        self,
        persona: Persona,
        user_message: str,
        chat_history: List[ChatMessage],
        is_own_persona: bool,
    ) -> str:
        """AI를 사용하여 페르소나 응답 생성"""
        # 대화 내역 포맷팅
        history_text = ""
        for msg in chat_history[:-1]:  # 마지막 메시지(현재) 제외
            role = "사용자" if msg.is_user else persona.name
            history_text += f"{role}: {msg.content}\n"

        # traits 파싱
        traits = persona.traits
        if isinstance(traits, str):
            try:
                traits = json.loads(traits)
            except (json.JSONDecodeError, TypeError):
                traits = [traits]
        traits_str = ", ".join(traits) if isinstance(traits, list) else str(traits)

        # OpenAI API 키가 없으면 기본 응답
        if not settings.OPENAI_API_KEY:
            return self._get_default_response(persona.name)

        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            # 프롬프트 선택
            if is_own_persona:
                # 임시 페르소나인 경우 별도 프롬프트 사용
                if persona.level == "temporary":
                    prompt = TEMPORARY_PERSONA_CHAT_PROMPT.format(
                        persona_name=persona.name,
                        personality=persona.personality,
                        traits=traits_str,
                        speaking_style=persona.speaking_style or "",
                        chat_history=history_text,
                        user_message=user_message,
                    )
                else:
                    prompt = PERSONA_CHAT_PROMPT.format(
                        persona_name=persona.name,
                        personality=persona.personality,
                        traits=traits_str,
                        speaking_style=persona.speaking_style or "",
                        chat_history=history_text,
                        user_message=user_message,
                    )
            else:
                # 친구 페르소나인 경우
                owner = persona.user
                prompt = FRIEND_PERSONA_CHAT_PROMPT.format(
                    persona_name=persona.name,
                    owner_name=owner.username if owner else "친구",
                    personality=persona.personality,
                    traits=traits_str,
                    speaking_style=persona.speaking_style or "",
                    chat_history=history_text,
                    user_message=user_message,
                )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are {persona.name}. Respond in Korean."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=300,
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            return self._get_default_response(persona.name)

    def _get_default_response(self, persona_name: str) -> str:
        """기본 응답 (AI 실패 시)"""
        return f"안녕! 나는 {persona_name}이야. 지금은 AI 서비스가 연결되지 않았어. 나중에 다시 이야기하자!"
