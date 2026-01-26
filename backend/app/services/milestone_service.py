import logging
from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.diary import Diary
from app.models.persona import Persona
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationType

logger = logging.getLogger(__name__)

# Milestone definitions
MILESTONES = {
    3: {
        "type": NotificationType.MILESTONE_3,
        "title": "일기 3개 달성!",
        "content": "일기를 3개 작성했어요! 페르소나가 '기본 페르소나'로 진화할 수 있어요.",
        "persona_level": "basic",
    },
    5: {
        "type": NotificationType.MILESTONE_5,
        "title": "일기 5개 달성!",
        "content": "벌써 일기 5개를 작성했네요! 완전한 페르소나까지 2개 남았어요.",
        "persona_level": None,
    },
    7: {
        "type": NotificationType.MILESTONE_7,
        "title": "일기 7개 달성!",
        "content": "축하해요! 이제 '완전한 페르소나'로 진화할 수 있어요!",
        "persona_level": "complete",
    },
}


class MilestoneService:
    def __init__(self, db: Session):
        self.db = db

    def check_milestones(self, user: User) -> List[Notification]:
        """
        Check if user has reached any milestones and create notifications.
        Returns list of newly created notifications.
        """
        diary_count = self.db.query(Diary).filter(
            Diary.user_id == user.id
        ).count()

        created_notifications = []

        for milestone_count, milestone_info in MILESTONES.items():
            # Check if user just reached this milestone
            if diary_count == milestone_count:
                # Check if notification already exists for this milestone
                existing = self.db.query(Notification).filter(
                    Notification.user_id == user.id,
                    Notification.type == milestone_info["type"].value,
                ).first()

                if not existing:
                    notification = self._create_milestone_notification(
                        user.id,
                        milestone_info["type"],
                        milestone_info["title"],
                        milestone_info["content"],
                    )
                    created_notifications.append(notification)
                    logger.info(
                        f"Milestone notification created for user {user.username}: "
                        f"{milestone_info['type'].value}"
                    )

                    # Check if persona upgrade is available
                    persona_level = milestone_info.get("persona_level")
                    if persona_level:
                        self._check_persona_upgrade(user, persona_level)

        return created_notifications

    def _create_milestone_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        content: str,
    ) -> Notification:
        """Create a milestone notification."""
        notification = Notification(
            user_id=user_id,
            type=notification_type.value,
            title=title,
            content=content,
            is_read=False,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def _check_persona_upgrade(self, user: User, target_level: str):
        """Check if persona can be upgraded and notify user."""
        persona = self.db.query(Persona).filter(
            Persona.user_id == user.id
        ).first()

        if not persona:
            return

        # If persona is at a lower level than target, notify about upgrade
        level_order = {"temporary": 0, "basic": 1, "complete": 2}
        current_level_order = level_order.get(persona.level, 0)
        target_level_order = level_order.get(target_level, 0)

        if current_level_order < target_level_order:
            # Create upgrade available notification
            level_names = {
                "basic": "기본 페르소나",
                "complete": "완전한 페르소나",
            }
            target_name = level_names.get(target_level, target_level)

            existing = self.db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.type == NotificationType.PERSONA_UPGRADE_AVAILABLE.value,
                Notification.is_read == False,
            ).first()

            if not existing:
                notification = Notification(
                    user_id=user.id,
                    type=NotificationType.PERSONA_UPGRADE_AVAILABLE.value,
                    title=f"페르소나 업그레이드 가능!",
                    content=f"'{target_name}'(으)로 진화할 준비가 됐어요! 페르소나 페이지에서 업그레이드하세요.",
                    is_read=False,
                )
                self.db.add(notification)
                self.db.commit()
                logger.info(
                    f"Persona upgrade notification created for user {user.username}: "
                    f"upgrade to {target_level}"
                )

    def create_upgrade_notification(self, user: User, new_level: str):
        """Create a notification when persona is upgraded."""
        level_names = {
            "temporary": "임시 페르소나",
            "basic": "기본 페르소나",
            "complete": "완전한 페르소나",
        }
        level_name = level_names.get(new_level, new_level)

        notification = Notification(
            user_id=user.id,
            type=NotificationType.PERSONA_UPGRADED.value,
            title=f"'{level_name}'(으)로 진화 완료!",
            content=f"페르소나가 '{level_name}'(으)로 진화했어요! 더 깊이 있는 대화를 즐겨보세요.",
            is_read=False,
        )
        self.db.add(notification)
        self.db.commit()
        logger.info(f"Persona upgraded notification created for user {user.username}")
        return notification
