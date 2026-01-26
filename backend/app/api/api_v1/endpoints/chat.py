from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_active_user
from app.core.business_logger import biz_log
from app.models.chat import PersonaChat, ChatMessage
from app.models.persona import Persona
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.schemas.chat import (
    ChatCreate,
    ChatResponse,
    ChatWithMessages,
    ChatListResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_in: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """새 채팅 세션 생성"""
    # 페르소나 존재 확인
    persona = db.query(Persona).filter(Persona.id == chat_in.persona_id).first()
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found",
        )

    # 자기 페르소나인지 친구 페르소나인지 확인
    is_own = persona.user_id == current_user.id

    # 친구 페르소나인 경우 친구 관계 확인
    if not is_own:
        friendship = db.query(Friendship).filter(
            or_(
                and_(
                    Friendship.requester_id == current_user.id,
                    Friendship.addressee_id == persona.user_id,
                ),
                and_(
                    Friendship.requester_id == persona.user_id,
                    Friendship.addressee_id == current_user.id,
                ),
            ),
            Friendship.status == FriendshipStatus.ACCEPTED,
        ).first()

        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only chat with persona of your friends",
            )

    chat = PersonaChat(
        user_id=current_user.id,
        persona_id=chat_in.persona_id,
        is_own_persona=is_own,
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    biz_log.chat_create(current_user.username, persona.name, is_own)
    return chat


@router.get("", response_model=ChatListResponse)
def get_chats(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """내 채팅 목록 조회"""
    query = db.query(PersonaChat).filter(PersonaChat.user_id == current_user.id)

    total = query.count()
    chats = query.order_by(PersonaChat.updated_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return ChatListResponse(items=chats, total=total)


@router.get("/{chat_id}", response_model=ChatWithMessages)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """채팅 상세 조회 (메시지 포함)"""
    chat = db.query(PersonaChat).filter(
        PersonaChat.id == chat_id,
        PersonaChat.user_id == current_user.id,
    ).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    return chat


@router.post("/{chat_id}/messages", response_model=MessageResponse)
async def send_message(
    chat_id: int,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """메시지 전송 및 AI 응답 받기"""
    chat = db.query(PersonaChat).filter(
        PersonaChat.id == chat_id,
        PersonaChat.user_id == current_user.id,
    ).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    # 페르소나 이름 조회
    persona = db.query(Persona).filter(Persona.id == chat.persona_id).first()
    persona_name = persona.name if persona else "Unknown"

    biz_log.chat_message(current_user.username, persona_name, message_in.content)

    chat_service = ChatService(db)
    response_message = await chat_service.send_message(chat, message_in.content)

    biz_log.chat_response(persona_name, response_message.content)
    return response_message


@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
def get_messages(
    chat_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """채팅 메시지 목록 조회"""
    chat = db.query(PersonaChat).filter(
        PersonaChat.id == chat_id,
        PersonaChat.user_id == current_user.id,
    ).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    messages = db.query(ChatMessage).filter(
        ChatMessage.chat_id == chat_id,
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()

    return messages


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """채팅 삭제"""
    chat = db.query(PersonaChat).filter(
        PersonaChat.id == chat_id,
        PersonaChat.user_id == current_user.id,
    ).first()

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    db.delete(chat)
    db.commit()
