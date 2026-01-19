from fastapi import APIRouter

from app.api.v1.endpoints import auth, personas, chats

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(personas.router, prefix="/personas", tags=["personas"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
