"""
개발 환경용 비즈니스 로거

운영(DEBUG=False)에서는 자동으로 비활성화됩니다.
간결한 한 줄 로그로 비즈니스 흐름을 파악할 수 있습니다.
"""

import logging
from functools import wraps
from typing import Any, Optional

from app.core.config import settings


class BusinessLogger:
    """개발 환경에서만 동작하는 비즈니스 로거"""

    def __init__(self):
        self.logger = logging.getLogger("business")
        self._setup_logger()

    def _setup_logger(self):
        """로거 설정"""
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "\033[36m[BIZ]\033[0m %(message)s"  # 청록색으로 BIZ 표시
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.DEBUG if settings.DEBUG else logging.WARNING)
            self.logger.propagate = False

    @property
    def enabled(self) -> bool:
        return settings.DEBUG

    def log(self, action: str, **kwargs):
        """비즈니스 로그 출력"""
        if not self.enabled:
            return

        # kwargs를 간결한 문자열로 변환
        details = " | ".join(f"{k}={v}" for k, v in kwargs.items() if v is not None)
        message = f"{action}" + (f" ({details})" if details else "")
        self.logger.debug(message)

    # === 인증 관련 ===
    def user_register(self, username: str, email: str):
        self.log("회원가입", user=username, email=email)

    def user_login(self, username: str):
        self.log("로그인", user=username)

    def user_me(self, username: str):
        self.log("내 정보 조회", user=username)

    # === 사용자 관련 ===
    def user_get(self, username: str, target_id: int):
        self.log("사용자 정보 조회", user=username, target_id=target_id)

    def user_search(self, username: str, query: str, count: int):
        self.log("사용자 검색", user=username, query=query, results=count)

    def user_update(self, username: str):
        self.log("내 정보 수정", user=username)

    # === 일기 관련 ===
    def diary_create(self, username: str, date: str, mood: Optional[str] = None):
        self.log("일기 작성", user=username, date=date, mood=mood)

    def diary_get(self, username: str, diary_id: int):
        self.log("일기 상세 조회", user=username, diary_id=diary_id)

    def diary_list(self, username: str, count: int, page: int = 1):
        self.log("일기 목록 조회", user=username, count=count, page=page)

    def diary_update(self, username: str, diary_id: int):
        self.log("일기 수정", user=username, diary_id=diary_id)

    def diary_delete(self, username: str, diary_id: int):
        self.log("일기 삭제", user=username, diary_id=diary_id)

    def diary_count(self, username: str, count: int):
        self.log("일기 개수 조회", user=username, count=count)

    def diary_stats(self, username: str, total: int):
        self.log("일기 통계 조회", user=username, total=total)

    def diary_prompt_suggestions(self, username: str):
        self.log("일기 주제 제안", user=username)

    # === 페르소나 관련 ===
    def persona_get_me(self, username: str, has_persona: bool):
        status = "있음" if has_persona else "없음"
        self.log("내 페르소나 조회", user=username, status=status)

    def persona_get_friend(self, username: str, friend_name: str):
        self.log("친구 페르소나 조회", user=username, friend=friend_name)

    def persona_status(self, username: str, can_generate: bool, diary_count: int):
        self.log("페르소나 생성 상태", user=username, can_generate=can_generate, diary_count=diary_count)

    def persona_generate(self, username: str, diary_count: int):
        self.log("페르소나 생성 시작", user=username, diary_count=diary_count)

    def persona_generated(self, username: str, persona_name: str):
        self.log("페르소나 생성 완료", user=username, persona=persona_name)

    def persona_regenerate(self, username: str):
        self.log("페르소나 재생성", user=username)

    def persona_customize(self, username: str):
        self.log("페르소나 커스터마이징", user=username)

    def persona_update(self, username: str):
        self.log("페르소나 설정 수정", user=username)

    # === 채팅 관련 ===
    def chat_list(self, username: str, count: int):
        self.log("채팅 목록 조회", user=username, count=count)

    def chat_get(self, username: str, chat_id: int):
        self.log("채팅 상세 조회", user=username, chat_id=chat_id)

    def chat_messages(self, username: str, chat_id: int, count: int):
        self.log("채팅 메시지 조회", user=username, chat_id=chat_id, count=count)

    def chat_create(self, username: str, persona_name: str, is_own: bool):
        chat_type = "내 페르소나" if is_own else "친구 페르소나"
        self.log("채팅 시작", user=username, persona=persona_name, type=chat_type)

    def chat_message(self, username: str, persona_name: str, msg_preview: str):
        preview = msg_preview[:20] + "..." if len(msg_preview) > 20 else msg_preview
        self.log("메시지 전송", user=username, to=persona_name, msg=preview)

    def chat_response(self, persona_name: str, response_preview: str):
        preview = response_preview[:20] + "..." if len(response_preview) > 20 else response_preview
        self.log("AI 응답", from_=persona_name, msg=preview)

    def chat_delete(self, username: str, chat_id: int):
        self.log("채팅 삭제", user=username, chat_id=chat_id)

    # === 친구 관련 ===
    def friend_list(self, username: str, count: int):
        self.log("친구 목록 조회", user=username, count=count)

    def friend_requests_received(self, username: str, count: int):
        self.log("받은 친구 요청 조회", user=username, count=count)

    def friend_requests_sent(self, username: str, count: int):
        self.log("보낸 친구 요청 조회", user=username, count=count)

    def friend_request(self, from_user: str, to_user: str):
        self.log("친구 요청", from_=from_user, to=to_user)

    def friend_accept(self, username: str, friend: str):
        self.log("친구 수락", user=username, friend=friend)

    def friend_reject(self, username: str, friend: str):
        self.log("친구 거절", user=username, friend=friend)

    def friend_delete(self, username: str, friend: str):
        self.log("친구 삭제", user=username, friend=friend)

    # === 알림 관련 ===
    def notification_list(self, username: str, count: int):
        self.log("알림 목록 조회", user=username, count=count)

    def notification_get(self, username: str, noti_id: int):
        self.log("알림 상세 조회", user=username, noti_id=noti_id)

    def notification_unread_count(self, username: str, count: int):
        self.log("읽지 않은 알림 개수", user=username, count=count)

    def notification_created(self, username: str, noti_type: str):
        self.log("알림 생성", user=username, type=noti_type)

    def notification_read(self, username: str, count: int = 1):
        self.log("알림 읽음", user=username, count=count)

    def notification_read_all(self, username: str):
        self.log("모든 알림 읽음", user=username)

    def notification_delete(self, username: str, noti_id: int):
        self.log("알림 삭제", user=username, noti_id=noti_id)


# 싱글톤 인스턴스
biz_log = BusinessLogger()
