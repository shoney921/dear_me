"""채팅 서비스 - 페르소나와 대화 관리"""

from datetime import datetime
from typing import Optional, List, AsyncGenerator

from sqlalchemy.orm import Session

from app.services.llm import (
    get_llm_client,
    SELF_CHAT_SYSTEM,
    FRIEND_CHAT_SYSTEM,
    GIFT_CONTEXT_ADDITION,
    format_diaries_for_prompt,
    detect_gift_context,
)


class ChatService:
    """채팅 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_client()

    def create_chat(
        self,
        persona_id: int,
        requester_id: int,
        title: Optional[str] = None,
    ) -> "PersonaChat":
        """새 대화 생성"""
        from app.models.chat import PersonaChat

        chat = PersonaChat(
            persona_id=persona_id,
            requester_id=requester_id,
            title=title,
        )
        self.db.add(chat)
        self.db.commit()
        self.db.refresh(chat)
        return chat

    def get_chat_by_id(self, chat_id: int) -> Optional["PersonaChat"]:
        """대화 ID로 조회"""
        from app.models.chat import PersonaChat

        return self.db.query(PersonaChat).filter(PersonaChat.id == chat_id).first()

    def get_user_chats(
        self,
        user_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List["PersonaChat"], int]:
        """사용자의 대화 목록 조회"""
        from app.models.chat import PersonaChat

        query = self.db.query(PersonaChat).filter(PersonaChat.requester_id == user_id)

        total = query.count()
        chats = (
            query.order_by(PersonaChat.updated_at.desc().nullsfirst())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return chats, total

    def get_chat_messages(self, chat_id: int) -> List["ChatMessage"]:
        """대화의 메시지 목록 조회"""
        from app.models.chat import ChatMessage

        return (
            self.db.query(ChatMessage)
            .filter(ChatMessage.chat_id == chat_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

    def add_message(
        self,
        chat_id: int,
        role: str,
        content: str,
    ) -> "ChatMessage":
        """메시지 추가"""
        from app.models.chat import ChatMessage, PersonaChat

        message = ChatMessage(
            chat_id=chat_id,
            role=role,
            content=content,
        )
        self.db.add(message)

        # 대화 업데이트 시간 갱신
        chat = self.get_chat_by_id(chat_id)
        if chat:
            chat.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(message)
        return message

    async def send_message_and_get_response(
        self,
        chat_id: int,
        user_message: str,
        requester_id: int,
    ) -> tuple["ChatMessage", "ChatMessage"]:
        """메시지 전송 및 응답 받기 (non-streaming)"""
        from app.models.persona import Persona
        from app.models.user import User

        chat = self.get_chat_by_id(chat_id)
        if not chat:
            raise ValueError("Chat not found")

        persona = self.db.query(Persona).filter(Persona.id == chat.persona_id).first()
        if not persona:
            raise ValueError("Persona not found")

        # 사용자 메시지 저장
        user_msg = self.add_message(chat_id, "user", user_message)

        # 대화 기록 가져오기
        chat_history = self._get_chat_history_for_llm(chat_id, exclude_last=True)

        # 시스템 프롬프트 생성
        system_prompt = await self._build_system_prompt(
            persona=persona,
            requester_id=requester_id,
            user_message=user_message,
        )

        # LLM 응답 생성
        response_content = await self.llm.generate(
            system_prompt=system_prompt,
            user_prompt=user_message,
            chat_history=chat_history,
        )

        # AI 응답 저장
        assistant_msg = self.add_message(chat_id, "assistant", response_content)

        return user_msg, assistant_msg

    async def stream_response(
        self,
        chat_id: int,
        user_message: str,
        requester_id: int,
    ) -> AsyncGenerator[str, None]:
        """스트리밍 응답 생성"""
        from app.models.persona import Persona

        chat = self.get_chat_by_id(chat_id)
        if not chat:
            raise ValueError("Chat not found")

        persona = self.db.query(Persona).filter(Persona.id == chat.persona_id).first()
        if not persona:
            raise ValueError("Persona not found")

        # 사용자 메시지 저장
        self.add_message(chat_id, "user", user_message)

        # 대화 기록 가져오기
        chat_history = self._get_chat_history_for_llm(chat_id, exclude_last=True)

        # 시스템 프롬프트 생성
        system_prompt = await self._build_system_prompt(
            persona=persona,
            requester_id=requester_id,
            user_message=user_message,
        )

        # 스트리밍 응답
        full_response = ""
        async for chunk in self.llm.stream(
            system_prompt=system_prompt,
            user_prompt=user_message,
            chat_history=chat_history,
        ):
            full_response += chunk
            yield chunk

        # 완료된 응답 저장
        self.add_message(chat_id, "assistant", full_response)

    async def _build_system_prompt(
        self,
        persona: "Persona",
        requester_id: int,
        user_message: str,
    ) -> str:
        """시스템 프롬프트 생성"""
        from app.models.diary import Diary
        from app.models.user import User

        # 페르소나 소유자 정보
        owner = self.db.query(User).filter(User.id == persona.user_id).first()
        owner_name = owner.name if owner else "사용자"

        # 요청자 정보
        requester = self.db.query(User).filter(User.id == requester_id).first()
        requester_name = requester.name if requester else "사용자"

        # 최근 일기 (비공개 제외)
        recent_diaries = (
            self.db.query(Diary)
            .filter(
                Diary.user_id == persona.user_id,
                Diary.is_private == False,
            )
            .order_by(Diary.date.desc())
            .limit(5)
            .all()
        )

        formatted_diaries = format_diaries_for_prompt(recent_diaries)
        traits_str = ", ".join(persona.traits) if persona.traits else ""
        interests_str = ", ".join(persona.interests) if persona.interests else ""

        # 자기 페르소나와 대화인지 친구 페르소나와 대화인지 구분
        is_self_chat = persona.user_id == requester_id

        if is_self_chat:
            system_prompt = SELF_CHAT_SYSTEM.format(
                user_name=owner_name,
                persona_name=persona.name or f"{owner_name}의 분신",
                personality=persona.personality or "",
                traits=traits_str,
                speaking_style=persona.speaking_style or "",
                summary=persona.summary or "",
                interests=interests_str,
                recent_diaries=formatted_diaries,
            )
        else:
            system_prompt = FRIEND_CHAT_SYSTEM.format(
                owner_name=owner_name,
                persona_name=persona.name or f"{owner_name}의 분신",
                personality=persona.personality or "",
                traits=traits_str,
                speaking_style=persona.speaking_style or "",
                summary=persona.summary or "",
                interests=interests_str,
                recent_diaries=formatted_diaries,
                requester_name=requester_name,
            )

            # 선물/서프라이즈 컨텍스트 감지
            if detect_gift_context(user_message):
                system_prompt += GIFT_CONTEXT_ADDITION.format(
                    requester_name=requester_name,
                    owner_name=owner_name,
                )

        return system_prompt

    def _get_chat_history_for_llm(
        self,
        chat_id: int,
        exclude_last: bool = False,
    ) -> List[dict]:
        """LLM용 대화 기록 포맷"""
        messages = self.get_chat_messages(chat_id)

        if exclude_last and messages:
            messages = messages[:-1]

        return [{"role": msg.role, "content": msg.content} for msg in messages]

    def delete_chat(self, chat_id: int) -> bool:
        """대화 삭제"""
        from app.models.chat import PersonaChat, ChatMessage

        # 메시지 먼저 삭제 (CASCADE가 설정되어 있어도 명시적으로)
        self.db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).delete()

        result = self.db.query(PersonaChat).filter(PersonaChat.id == chat_id).delete()
        self.db.commit()
        return result > 0


def get_chat_service(db: Session) -> ChatService:
    """ChatService 인스턴스 반환"""
    return ChatService(db)
