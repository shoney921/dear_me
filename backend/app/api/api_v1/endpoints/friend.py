from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_active_user
from app.models.friendship import Friendship, FriendshipStatus
from app.models.user import User
from app.schemas.friendship import (
    FriendshipCreate,
    FriendshipResponse,
    FriendshipUpdate,
    FriendshipWithUser,
    FriendListResponse,
)
from app.schemas.user import UserResponse

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

    friendship = Friendship(
        requester_id=current_user.id,
        addressee_id=request.addressee_id,
        status=FriendshipStatus.PENDING,
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)

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

    friendship.status = update.status
    db.commit()
    db.refresh(friendship)

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

    db.delete(friendship)
    db.commit()
