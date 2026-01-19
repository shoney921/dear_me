"""채팅 API 엔드포인트"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.persona import Persona
from app.schemas.chat import (
    PersonaChatCreate,
    PersonaChatResponse,
    PersonaChatDetailResponse,
    ChatListResponse,
    SendMessageRequest,
    SendMessageResponse,
    ChatMessageResponse,
)
from app.services.chat_service import get_chat_service
from app.services.persona_service import get_persona_service


router = APIRouter()


@router.post("/persona/{persona_id}", response_model=PersonaChatResponse)
async def create_chat(
    persona_id: int,
    request: Optional[PersonaChatCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """새 대화 시작"""
    persona_service = get_persona_service(db)
    chat_service = get_chat_service(db)

    # 페르소나 존재 확인
    persona = persona_service.get_persona_by_id(persona_id)
    if not persona:
        raise HTTPException(
            status_code=404,
            detail="페르소나를 찾을 수 없습니다.",
        )

    # 자신의 페르소나이거나 공개된 페르소나만 대화 가능
    is_own_persona = persona.user_id == current_user.id
    if not is_own_persona and not persona.is_public:
        raise HTTPException(
            status_code=403,
            detail="비공개 페르소나입니다.",
        )

    # TODO: Phase 2에서 친구 관계 확인 로직 추가

    title = request.title if request else None
    chat = chat_service.create_chat(
        persona_id=persona_id,
        requester_id=current_user.id,
        title=title,
    )

    # 추가 정보 포함
    owner = db.query(User).filter(User.id == persona.user_id).first()

    return PersonaChatResponse(
        id=chat.id,
        persona_id=chat.persona_id,
        requester_id=chat.requester_id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        persona_name=persona.name,
        owner_name=owner.name if owner else None,
        message_count=0,
    )


@router.get("", response_model=ChatListResponse)
async def get_chats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 대화 목록 조회"""
    chat_service = get_chat_service(db)
    chats, total = chat_service.get_user_chats(
        user_id=current_user.id,
        page=page,
        limit=limit,
    )

    chat_responses = []
    for chat in chats:
        # 페르소나 정보
        persona = db.query(Persona).filter(Persona.id == chat.persona_id).first()
        owner = None
        if persona:
            owner = db.query(User).filter(User.id == persona.user_id).first()

        # 마지막 메시지
        messages = chat_service.get_chat_messages(chat.id)
        last_message = messages[-1].content if messages else None

        chat_responses.append(
            PersonaChatResponse(
                id=chat.id,
                persona_id=chat.persona_id,
                requester_id=chat.requester_id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                persona_name=persona.name if persona else None,
                owner_name=owner.name if owner else None,
                last_message=last_message[:50] + "..." if last_message and len(last_message) > 50 else last_message,
                message_count=len(messages),
            )
        )

    return ChatListResponse(
        chats=chat_responses,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{chat_id}", response_model=PersonaChatDetailResponse)
async def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """대화 상세 조회 (메시지 포함)"""
    chat_service = get_chat_service(db)
    chat = chat_service.get_chat_by_id(chat_id)

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="대화를 찾을 수 없습니다.",
        )

    if chat.requester_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="이 대화에 접근할 권한이 없습니다.",
        )

    # 페르소나 정보
    persona = db.query(Persona).filter(Persona.id == chat.persona_id).first()
    owner = None
    if persona:
        owner = db.query(User).filter(User.id == persona.user_id).first()

    # 메시지 목록
    messages = chat_service.get_chat_messages(chat_id)

    return PersonaChatDetailResponse(
        id=chat.id,
        persona_id=chat.persona_id,
        requester_id=chat.requester_id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        persona_name=persona.name if persona else None,
        owner_name=owner.name if owner else None,
        message_count=len(messages),
        messages=[
            ChatMessageResponse(
                id=msg.id,
                chat_id=msg.chat_id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
            )
            for msg in messages
        ],
    )


@router.post("/{chat_id}/messages", response_model=SendMessageResponse)
async def send_message(
    chat_id: int,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """메시지 전송 (non-streaming)"""
    chat_service = get_chat_service(db)
    chat = chat_service.get_chat_by_id(chat_id)

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="대화를 찾을 수 없습니다.",
        )

    if chat.requester_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="이 대화에 메시지를 보낼 권한이 없습니다.",
        )

    try:
        user_msg, assistant_msg = await chat_service.send_message_and_get_response(
            chat_id=chat_id,
            user_message=request.content,
            requester_id=current_user.id,
        )

        return SendMessageResponse(
            user_message=ChatMessageResponse(
                id=user_msg.id,
                chat_id=user_msg.chat_id,
                role=user_msg.role,
                content=user_msg.content,
                created_at=user_msg.created_at,
            ),
            assistant_message=ChatMessageResponse(
                id=assistant_msg.id,
                chat_id=assistant_msg.chat_id,
                role=assistant_msg.role,
                content=assistant_msg.content,
                created_at=assistant_msg.created_at,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"메시지 전송 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/{chat_id}/messages/stream")
async def send_message_stream(
    chat_id: int,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """메시지 전송 (streaming)

    SSE (Server-Sent Events) 형식으로 응답
    """
    chat_service = get_chat_service(db)
    chat = chat_service.get_chat_by_id(chat_id)

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="대화를 찾을 수 없습니다.",
        )

    if chat.requester_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="이 대화에 메시지를 보낼 권한이 없습니다.",
        )

    async def generate():
        try:
            async for chunk in chat_service.stream_response(
                chat_id=chat_id,
                user_message=request.content,
                requester_id=current_user.id,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """대화 삭제"""
    chat_service = get_chat_service(db)
    chat = chat_service.get_chat_by_id(chat_id)

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="대화를 찾을 수 없습니다.",
        )

    if chat.requester_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="이 대화를 삭제할 권한이 없습니다.",
        )

    chat_service.delete_chat(chat_id)

    return {"success": True, "message": "대화가 삭제되었습니다."}
