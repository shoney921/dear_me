from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "DearMe"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://dearme:dearme123@postgres:5432/dearme"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # SMTP (Email Verification)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "DearMe"
    FRONTEND_URL: str = "http://localhost:5173"
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1

    # OpenAI
    OPENAI_API_KEY: str = ""

    # RAG Settings
    RAG_EMBEDDING_MODEL: str = "jhgan/ko-sroberta-multitask"
    RAG_EMBEDDING_DIMENSION: int = 768
    RAG_TOP_K: int = 3
    RAG_SIMILARITY_THRESHOLD: float = 0.3
    RAG_CONTEXT_LEVEL: str = "detailed"  # minimal, standard, detailed

    # Debug
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
