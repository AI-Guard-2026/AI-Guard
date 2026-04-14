# app/core/config.py
# Central configuration loaded from environment variables

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AIGuard"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    # Database — has default so Pylance stops complaining
    # Real value must be in .env
    DATABASE_URL: str = "postgresql://aiguard:aiguard_dev_password@localhost:5432/aiguard_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "change-this-in-production-make-it-very-long-and-random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-central-1"
    AWS_S3_BUCKET: str = ""

    # Clerk
    CLERK_SECRET_KEY: str = ""
    CLERK_JWT_ISSUER: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"    # Ignores any extra keys in .env


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()