"""
DearMe 개발 환경용 시드 데이터 생성 스크립트

사용법:
    # 시드 데이터 생성
    docker-compose exec backend python -m scripts.seed_data

    # 기존 데이터 삭제 후 시드 데이터 생성
    docker-compose exec backend python -m scripts.seed_data --clear
"""

import argparse
import logging
import random
import sys
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.diary import Diary
from app.models.persona import Persona
from app.models.friendship import Friendship, FriendshipStatus
from app.models.chat import PersonaChat, ChatMessage
from app.models.notification import Notification
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus

from scripts.seed_contents import (
    USERS,
    DIARY_CONTENTS,
    PERSONA_TEMPLATES,
    CHAT_MESSAGES_SAMPLES,
    FRIEND_CHAT_MESSAGES_SAMPLES,
    NOTIFICATION_TEMPLATES,
)

# 로깅 설정
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# 공통 비밀번호
DEFAULT_PASSWORD = "test1234"


def clear_all_data(db: Session) -> None:
    """모든 테스트 데이터 삭제"""
    logger.info("기존 데이터 삭제 중...")

    # 외래키 순서대로 삭제
    db.query(ChatMessage).delete()
    db.query(PersonaChat).delete()
    db.query(Notification).delete()
    db.query(Friendship).delete()
    db.query(Subscription).delete()
    db.query(Persona).delete()
    db.query(Diary).delete()
    db.query(User).delete()

    db.commit()
    logger.info("기존 데이터 삭제 완료")


def create_users(db: Session) -> list[User]:
    """테스트 유저 생성"""
    logger.info("유저 생성 중...")

    users = []
    hashed_password = get_password_hash(DEFAULT_PASSWORD)

    for user_data in USERS:
        # 이미 존재하는지 확인
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            users.append(existing)
            continue

        user = User(
            email=user_data["email"],
            username=user_data["username"],
            hashed_password=hashed_password,
            profile_image=user_data["profile_image"],
            is_active=True,
        )
        db.add(user)
        users.append(user)

    db.commit()

    # ID 새로고침
    for user in users:
        db.refresh(user)

    logger.info(f"유저 {len(users)}명 생성 완료")
    return users


def create_diaries(db: Session, users: list[User]) -> list[Diary]:
    """일기 생성 (유저당 8개)"""
    logger.info("일기 생성 중...")

    diaries = []
    base_date = datetime.now().date()

    for i, user in enumerate(users):
        # 해당 유저의 일기 콘텐츠
        user_diary_contents = DIARY_CONTENTS[i]

        for j, diary_data in enumerate(user_diary_contents):
            # 날짜를 과거로 설정 (최근 30일 내)
            diary_date = base_date - timedelta(days=30 - j * 3)

            diary = Diary(
                user_id=user.id,
                title=diary_data["title"],
                content=diary_data["content"],
                mood=diary_data["mood"],
                weather=diary_data["weather"],
                diary_date=diary_date,
            )
            db.add(diary)
            diaries.append(diary)

    db.commit()
    logger.info(f"일기 {len(diaries)}개 생성 완료")
    return diaries


def create_personas(db: Session, users: list[User]) -> list[Persona]:
    """페르소나 생성"""
    logger.info("페르소나 생성 중...")

    personas = []

    for i, user in enumerate(users):
        # 이미 페르소나가 있는지 확인
        existing = db.query(Persona).filter(Persona.user_id == user.id).first()
        if existing:
            personas.append(existing)
            continue

        template = PERSONA_TEMPLATES[i]

        persona = Persona(
            user_id=user.id,
            name=template["name"],
            personality=template["personality"],
            traits=template["traits"],
            speaking_style=template["speaking_style"],
            avatar_url=None,
            is_public=True,
        )
        db.add(persona)
        personas.append(persona)

    db.commit()

    for persona in personas:
        db.refresh(persona)

    logger.info(f"페르소나 {len(personas)}개 생성 완료")
    return personas


def create_friendships(db: Session, users: list[User]) -> list[Friendship]:
    """친구 관계 생성"""
    logger.info("친구 관계 생성 중...")

    friendships = []
    created_pairs = set()

    # ACCEPTED 상태 친구 관계 (20-25개)
    accepted_pairs = [
        (0, 1), (0, 2), (0, 3), (0, 4),  # 유저1의 친구
        (1, 2), (1, 3), (1, 5),          # 유저2의 친구
        (2, 4), (2, 5), (2, 6),          # 유저3의 친구
        (3, 4), (3, 5), (3, 7),          # 유저4의 친구
        (4, 6), (4, 7), (4, 8),          # 유저5의 친구
        (5, 6), (5, 8),                  # 유저6의 친구
        (6, 7), (6, 9),                  # 유저7의 친구
        (7, 8), (7, 9),                  # 유저8의 친구
        (8, 9),                          # 유저9의 친구
    ]

    for req_idx, addr_idx in accepted_pairs:
        pair_key = tuple(sorted([req_idx, addr_idx]))
        if pair_key in created_pairs:
            continue

        # 이미 존재하는지 확인
        existing = db.query(Friendship).filter(
            ((Friendship.requester_id == users[req_idx].id) & (Friendship.addressee_id == users[addr_idx].id)) |
            ((Friendship.requester_id == users[addr_idx].id) & (Friendship.addressee_id == users[req_idx].id))
        ).first()

        if existing:
            friendships.append(existing)
            created_pairs.add(pair_key)
            continue

        friendship = Friendship(
            requester_id=users[req_idx].id,
            addressee_id=users[addr_idx].id,
            status=FriendshipStatus.ACCEPTED,
        )
        db.add(friendship)
        friendships.append(friendship)
        created_pairs.add(pair_key)

    # PENDING 상태 친구 요청 (3개)
    pending_pairs = [
        (9, 0),  # 유저10 -> 유저1
        (9, 2),  # 유저10 -> 유저3
        (0, 9),  # 유저1 -> 유저10 (이미 있으므로 다른 쌍으로)
    ]

    # 중복되지 않는 PENDING 요청 추가
    pending_count = 0
    for req_idx, addr_idx in pending_pairs:
        if pending_count >= 3:
            break

        pair_key = tuple(sorted([req_idx, addr_idx]))
        if pair_key in created_pairs:
            continue

        existing = db.query(Friendship).filter(
            ((Friendship.requester_id == users[req_idx].id) & (Friendship.addressee_id == users[addr_idx].id)) |
            ((Friendship.requester_id == users[addr_idx].id) & (Friendship.addressee_id == users[req_idx].id))
        ).first()

        if existing:
            continue

        friendship = Friendship(
            requester_id=users[req_idx].id,
            addressee_id=users[addr_idx].id,
            status=FriendshipStatus.PENDING,
        )
        db.add(friendship)
        friendships.append(friendship)
        created_pairs.add(pair_key)
        pending_count += 1

    db.commit()
    logger.info(f"친구 관계 {len(friendships)}개 생성 완료")
    return friendships


def create_chats_and_messages(
    db: Session, users: list[User], personas: list[Persona], friendships: list[Friendship]
) -> tuple[list[PersonaChat], list[ChatMessage]]:
    """채팅 및 메시지 생성"""
    logger.info("채팅 및 메시지 생성 중...")

    chats = []
    messages = []

    # 자기 페르소나와의 대화 (5개)
    for i in range(5):
        user = users[i]
        persona = personas[i]

        chat = PersonaChat(
            user_id=user.id,
            persona_id=persona.id,
            is_own_persona=True,
        )
        db.add(chat)
        db.flush()  # ID 생성

        # 메시지 추가
        msg_data = CHAT_MESSAGES_SAMPLES[i % len(CHAT_MESSAGES_SAMPLES)]
        for msg in msg_data["messages"]:
            message = ChatMessage(
                chat_id=chat.id,
                content=msg["content"],
                is_user=msg["is_user"],
            )
            db.add(message)
            messages.append(message)

        chats.append(chat)

    # 친구 페르소나와의 대화 (ACCEPTED 친구 관계 기반)
    accepted_friendships = [f for f in friendships if f.status == FriendshipStatus.ACCEPTED]

    # 최대 10개의 친구 페르소나 대화 생성
    for i, friendship in enumerate(accepted_friendships[:10]):
        user = db.query(User).filter(User.id == friendship.requester_id).first()
        friend_persona = db.query(Persona).filter(Persona.user_id == friendship.addressee_id).first()

        if not friend_persona:
            continue

        chat = PersonaChat(
            user_id=user.id,
            persona_id=friend_persona.id,
            is_own_persona=False,
        )
        db.add(chat)
        db.flush()

        # 메시지 추가
        msg_data = FRIEND_CHAT_MESSAGES_SAMPLES[i % len(FRIEND_CHAT_MESSAGES_SAMPLES)]
        for msg in msg_data["messages"]:
            message = ChatMessage(
                chat_id=chat.id,
                content=msg["content"],
                is_user=msg["is_user"],
            )
            db.add(message)
            messages.append(message)

        chats.append(chat)

    db.commit()
    logger.info(f"채팅 {len(chats)}개, 메시지 {len(messages)}개 생성 완료")
    return chats, messages


def create_notifications(db: Session, users: list[User], friendships: list[Friendship]) -> list[Notification]:
    """알림 생성"""
    logger.info("알림 생성 중...")

    notifications = []

    # PENDING 친구 요청 알림
    pending_friendships = [f for f in friendships if f.status == FriendshipStatus.PENDING]
    for friendship in pending_friendships:
        requester = db.query(User).filter(User.id == friendship.requester_id).first()
        notification = Notification(
            user_id=friendship.addressee_id,
            type="friend_request",
            title="새로운 친구 요청",
            content=f"{requester.username}님이 친구 요청을 보냈습니다.",
            is_read=False,
            related_id=friendship.id,
        )
        db.add(notification)
        notifications.append(notification)

    # 일기 작성 알림 (몇몇 유저에게)
    for i in [0, 2, 4, 6, 8]:
        notification = Notification(
            user_id=users[i].id,
            type="diary_reminder",
            title="일기 작성 알림",
            content="오늘의 일기를 작성해보세요!",
            is_read=random.choice([True, False]),
        )
        db.add(notification)
        notifications.append(notification)

    # 페르소나 업데이트 알림
    for i in [1, 3, 5, 7]:
        notification = Notification(
            user_id=users[i].id,
            type="persona_updated",
            title="페르소나 업데이트",
            content="새로운 일기를 바탕으로 페르소나가 업데이트되었습니다.",
            is_read=True,
        )
        db.add(notification)
        notifications.append(notification)

    db.commit()
    logger.info(f"알림 {len(notifications)}개 생성 완료")
    return notifications


def create_subscriptions(db: Session, users: list[User]) -> list[Subscription]:
    """구독 정보 생성"""
    logger.info("구독 정보 생성 중...")

    subscriptions = []

    for i, user in enumerate(users):
        # 이미 존재하는지 확인
        existing = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if existing:
            subscriptions.append(existing)
            continue

        # 유저1, 유저2는 프리미엄
        if i < 2:
            subscription = Subscription(
                user_id=user.id,
                plan=SubscriptionPlan.PREMIUM,
                status=SubscriptionStatus.ACTIVE,
                expires_at=datetime.utcnow() + timedelta(days=30),
            )
        else:
            subscription = Subscription(
                user_id=user.id,
                plan=SubscriptionPlan.FREE,
                status=SubscriptionStatus.ACTIVE,
            )
        db.add(subscription)
        subscriptions.append(subscription)

    db.commit()
    logger.info(f"구독 정보 {len(subscriptions)}개 생성 완료")
    return subscriptions


def seed_database(clear: bool = False) -> None:
    """메인 시드 함수"""
    db = SessionLocal()

    try:
        if clear:
            clear_all_data(db)

        logger.info("=" * 50)
        logger.info("DearMe 시드 데이터 생성 시작")
        logger.info("=" * 50)

        # 1. 유저 생성
        users = create_users(db)

        # 2. 일기 생성
        diaries = create_diaries(db, users)

        # 3. 페르소나 생성
        personas = create_personas(db, users)

        # 4. 친구 관계 생성
        friendships = create_friendships(db, users)

        # 5. 채팅 및 메시지 생성
        chats, messages = create_chats_and_messages(db, users, personas, friendships)

        # 6. 알림 생성
        notifications = create_notifications(db, users, friendships)

        # 7. 구독 정보 생성
        subscriptions = create_subscriptions(db, users)

        logger.info("=" * 50)
        logger.info("시드 데이터 생성 완료!")
        logger.info("=" * 50)
        logger.info(f"- 유저: {len(users)}명")
        logger.info(f"- 일기: {len(diaries)}개")
        logger.info(f"- 페르소나: {len(personas)}개")
        logger.info(f"- 친구 관계: {len(friendships)}개")
        logger.info(f"- 채팅: {len(chats)}개")
        logger.info(f"- 메시지: {len(messages)}개")
        logger.info(f"- 알림: {len(notifications)}개")
        logger.info(f"- 구독: {len(subscriptions)}개")
        logger.info("=" * 50)
        logger.info("테스트 계정:")
        logger.info(f"  Email: user1@test.com ~ user10@test.com")
        logger.info(f"  Password: {DEFAULT_PASSWORD}")
        logger.info("=" * 50)

    except Exception as e:
        logger.error(f"시드 데이터 생성 중 오류 발생: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="DearMe 시드 데이터 생성")
    parser.add_argument(
        "--clear", "-c",
        action="store_true",
        help="기존 데이터를 삭제하고 새로 생성"
    )

    args = parser.parse_args()
    seed_database(clear=args.clear)


if __name__ == "__main__":
    main()
