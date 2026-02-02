from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth,
    user,
    diary,
    persona,
    friend,
    chat,
    notification,
    subscription,
    quiz,
    mental,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(diary.router, prefix="/diaries", tags=["diaries"])
api_router.include_router(persona.router, prefix="/personas", tags=["personas"])
api_router.include_router(friend.router, prefix="/friends", tags=["friends"])
api_router.include_router(chat.router, prefix="/chats", tags=["chats"])
api_router.include_router(notification.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(subscription.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(mental.router, prefix="/mental", tags=["mental"])
