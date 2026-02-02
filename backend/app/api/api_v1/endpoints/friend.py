from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_active_user
from app.core.business_logger import biz_log
from app.models.friendship import Friendship, FriendshipStatus
from app.models.user import User
from app.models.persona import Persona
from app.schemas.friendship import (
    FriendshipCreate,
    FriendshipResponse,
    FriendshipUpdate,
    FriendshipWithUser,
    FriendListResponse,
    FriendWithPersonaResponse,
    FriendRecommendationResponse,
)
from app.schemas.user import UserResponse
from app.services.subscription_service import SubscriptionService

router = APIRouter()


@router.post("/request", response_model=FriendshipResponse, status_code=status.HTTP_201_CREATED)
def send_friend_request(
    request: FriendshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 요청 보내기"""
    if request.addressee_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself",
        )

    # 대상 사용자 존재 확인
    addressee = db.query(User).filter(User.id == request.addressee_id).first()
    if not addressee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # 이미 친구 관계인지 확인
    existing = db.query(Friendship).filter(
        or_(
            and_(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == request.addressee_id,
            ),
            and_(
                Friendship.requester_id == request.addressee_id,
                Friendship.addressee_id == current_user.id,
            ),
        )
    ).first()

    if existing:
        if existing.status == FriendshipStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already friends",
            )
        elif existing.status == FriendshipStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already exists",
            )

    # 친구 수 제한 확인
    subscription_service = SubscriptionService(db)
    can_add, error_message = subscription_service.can_add_friend(current_user)
    if not can_add:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_message,
        )

    friendship = Friendship(
        requester_id=current_user.id,
        addressee_id=request.addressee_id,
        status=FriendshipStatus.PENDING,
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)

    biz_log.friend_request(current_user.username, addressee.username)
    return friendship


@router.get("/requests/received", response_model=list[FriendshipWithUser])
def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """받은 친구 요청 목록"""
    requests = db.query(Friendship).filter(
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING,
    ).all()

    result = []
    for req in requests:
        data = FriendshipWithUser.model_validate(req)
        data.requester = UserResponse.model_validate(req.requester)
        result.append(data)

    biz_log.friend_requests_received(current_user.username, len(result))
    return result


@router.get("/requests/sent", response_model=list[FriendshipWithUser])
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """보낸 친구 요청 목록"""
    requests = db.query(Friendship).filter(
        Friendship.requester_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING,
    ).all()

    result = []
    for req in requests:
        data = FriendshipWithUser.model_validate(req)
        data.addressee = UserResponse.model_validate(req.addressee)
        result.append(data)

    biz_log.friend_requests_sent(current_user.username, len(result))
    return result


@router.patch("/requests/{friendship_id}", response_model=FriendshipResponse)
def respond_to_request(
    friendship_id: int,
    update: FriendshipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 요청 수락/거절"""
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING,
    ).first()

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found",
        )

    requester = db.query(User).filter(User.id == friendship.requester_id).first()
    requester_name = requester.username if requester else "Unknown"

    friendship.status = update.status
    db.commit()
    db.refresh(friendship)

    if update.status == FriendshipStatus.ACCEPTED:
        biz_log.friend_accept(current_user.username, requester_name)
    else:
        biz_log.friend_reject(current_user.username, requester_name)

    return friendship


@router.get("", response_model=FriendListResponse)
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 목록 조회"""
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        ),
        Friendship.status == FriendshipStatus.ACCEPTED,
    ).all()

    friends = []
    for f in friendships:
        if f.requester_id == current_user.id:
            friends.append(f.addressee)
        else:
            friends.append(f.requester)

    biz_log.friend_list(current_user.username, len(friends))
    return FriendListResponse(friends=friends, total=len(friends))


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 삭제"""
    friendship = db.query(Friendship).filter(
        or_(
            and_(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == friend_id,
            ),
            and_(
                Friendship.requester_id == friend_id,
                Friendship.addressee_id == current_user.id,
            ),
        ),
        Friendship.status == FriendshipStatus.ACCEPTED,
    ).first()

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found",
        )

    # 삭제되는 친구 이름 조회
    friend = db.query(User).filter(User.id == friend_id).first()
    friend_name = friend.username if friend else "Unknown"

    biz_log.friend_delete(current_user.username, friend_name)
    db.delete(friendship)
    db.commit()


@router.get("/with-persona", response_model=list[FriendWithPersonaResponse])
def get_friends_with_persona(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 목록 조회 (페르소나 정보 포함)"""
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        ),
        Friendship.status == FriendshipStatus.ACCEPTED,
    ).all()

    result = []
    for f in friendships:
        friend = f.addressee if f.requester_id == current_user.id else f.requester

        # 해당 친구의 공개 페르소나 조회
        persona = db.query(Persona).filter(
            Persona.user_id == friend.id,
            Persona.is_public == True,
        ).first()

        result.append(FriendWithPersonaResponse(
            id=friend.id,
            username=friend.username,
            email=friend.email,
            profile_image=friend.profile_image,
            persona_name=persona.name if persona else None,
            persona_id=persona.id if persona else None,
        ))

    return result


@router.get("/recommendations", response_model=FriendRecommendationResponse)
def get_friend_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """친구 추천 목록 조회 (공개 페르소나 보유자)"""
    # 이미 친구인 사용자 ID 목록
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id,
        ),
        Friendship.status.in_([FriendshipStatus.ACCEPTED, FriendshipStatus.PENDING]),
    ).all()

    excluded_ids = {current_user.id}
    for f in friendships:
        excluded_ids.add(f.requester_id)
        excluded_ids.add(f.addressee_id)

    # 공개 페르소나를 가진 사용자 목록 조회
    personas = db.query(Persona).filter(
        Persona.is_public == True,
        ~Persona.user_id.in_(excluded_ids),
    ).all()

    recommendations = []
    for persona in personas:
        user = persona.user
        recommendations.append(FriendWithPersonaResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            profile_image=user.profile_image,
            persona_name=persona.name,
            persona_id=persona.id,
        ))

    return FriendRecommendationResponse(users=recommendations)
