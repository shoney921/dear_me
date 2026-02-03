import json
import logging
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.constants.prompts import (
    PERSONA_CHAT_PROMPT,
    FRIEND_PERSONA_CHAT_PROMPT,
    TEMPORARY_PERSONA_CHAT_PROMPT,
    RAG_PERSONA_CHAT_PROMPT,
    RAG_FRIEND_PERSONA_CHAT_PROMPT,
)
from app.models.chat import PersonaChat, ChatMessage
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.user import User

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

        # 사용자의 RAG 컨텍스트 레벨 결정
        context_level = self._get_context_level(persona.user_id, chat.is_own_persona)

        # RAG: 유사 일기 검색
        rag_context = await self._get_rag_context(
            user_message=content,
            persona_user_id=persona.user_id,
            context_level=context_level,
        )

        # AI 응답 생성
        ai_response = await self._generate_response(
            persona=persona,
            user_message=content,
            chat_history=list(reversed(previous_messages)),
            is_own_persona=chat.is_own_persona,
            rag_context=rag_context,
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

    def _get_context_level(self, persona_user_id: int, is_own_persona: bool) -> str:
        """RAG 컨텍스트 레벨 결정 (사용자 설정 또는 시스템 기본값)"""
        # 페르소나 주인의 설정 가져오기
        persona_owner = self.db.query(User).filter(User.id == persona_user_id).first()
        context_level = (
            persona_owner.rag_context_level
            if persona_owner and persona_owner.rag_context_level
            else settings.RAG_CONTEXT_LEVEL
        )

        # 친구 페르소나 대화 시 최대 standard까지만 허용 (프라이버시 보호)
        if not is_own_persona and context_level == "detailed":
            context_level = "standard"

        return context_level

    async def _get_rag_context(
        self,
        user_message: str,
        persona_user_id: int,
        context_level: str = "standard",
    ) -> str:
        """RAG: 사용자 메시지와 유사한 일기 검색하여 컨텍스트 생성

        Args:
            user_message: 사용자 메시지
            persona_user_id: 페르소나 주인의 ID
            context_level: 컨텍스트 레벨 (minimal, standard, detailed)
        """
        try:
            from app.services.embedding_service import EmbeddingService

            similar_diaries = EmbeddingService.search_similar_diaries(
                db=self.db,
                query=user_message,
                user_id=persona_user_id,
            )

            if not similar_diaries:
                return "관련 기억이 없습니다."

            context_parts = []
            for diary, score in similar_diaries:
                if context_level == "minimal":
                    # 최소: 제목, 날짜만
                    context_parts.append(f"- [{diary.diary_date}] {diary.title}")
                elif context_level == "standard":
                    # 표준: 제목, 날짜, 기분
                    mood_str = f", 기분: {diary.mood}" if diary.mood else ""
                    context_parts.append(f"- [{diary.diary_date}] {diary.title}{mood_str}")
                else:  # detailed
                    # 상세: 제목, 날짜, 기분, 본문 일부 (150자)
                    mood_str = f", 기분: {diary.mood}" if diary.mood else ""
                    content_preview = (
                        diary.content[:150] + "..."
                        if len(diary.content) > 150
                        else diary.content
                    )
                    context_parts.append(
                        f"- [{diary.diary_date}] {diary.title}{mood_str}\n  내용: {content_preview}"
                    )

            return "\n".join(context_parts)

        except Exception as e:
            logger.warning(f"RAG context retrieval failed: {e}")
            # 트랜잭션 에러 시 롤백하여 이후 쿼리가 정상 동작하도록 함
            self.db.rollback()
            return "관련 기억을 불러올 수 없습니다."

    async def _generate_response(
        self,
        persona: Persona,
        user_message: str,
        chat_history: List[ChatMessage],
        is_own_persona: bool,
        rag_context: str = "",
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

            # 프롬프트 선택 (RAG 컨텍스트가 있으면 RAG 프롬프트 사용)
            has_rag_context = rag_context and "관련 기억이 없습니다" not in rag_context

            if is_own_persona:
                # 임시 페르소나인 경우 별도 프롬프트 사용 (RAG 미적용)
                if persona.level == "temporary":
                    prompt = TEMPORARY_PERSONA_CHAT_PROMPT.format(
                        persona_name=persona.name,
                        personality=persona.personality,
                        traits=traits_str,
                        speaking_style=persona.speaking_style or "",
                        chat_history=history_text,
                        user_message=user_message,
                    )
                elif has_rag_context:
                    # RAG 컨텍스트가 있으면 RAG 프롬프트 사용
                    prompt = RAG_PERSONA_CHAT_PROMPT.format(
                        persona_name=persona.name,
                        personality=persona.personality,
                        traits=traits_str,
                        speaking_style=persona.speaking_style or "",
                        rag_context=rag_context,
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
                if has_rag_context:
                    prompt = RAG_FRIEND_PERSONA_CHAT_PROMPT.format(
                        persona_name=persona.name,
                        owner_name=owner.username if owner else "친구",
                        personality=persona.personality,
                        traits=traits_str,
                        speaking_style=persona.speaking_style or "",
                        rag_context=rag_context,
                        chat_history=history_text,
                        user_message=user_message,
                    )
                else:
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
