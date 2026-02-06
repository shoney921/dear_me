import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.core.limiter import limiter


# 로깅 설정
def setup_logging():
    """개발/운영 환경에 맞는 로깅 설정"""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # 기본 로깅 포맷
    logging.basicConfig(
        level=log_level,
        format="%(levelname)s: %(message)s" if settings.DEBUG else "%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    # 외부 라이브러리 로그 레벨 조정 (너무 verbose한 것들)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 시 실행되는 이벤트"""
    # Startup: 임베딩 모델 미리 로딩 (첫 요청 지연 방지)
    try:
        from app.services.embedding_service import EmbeddingService
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, EmbeddingService.get_model)
        logger.info("Embedding model pre-loaded at startup")
    except Exception as e:
        logger.warning(f"Failed to pre-load embedding model: {e}")

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="일기 기반 AI 페르소나 서비스",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Rate Limiting
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Welcome to DearMe API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# API 라우터 등록
app.include_router(api_router, prefix=settings.API_V1_STR)
