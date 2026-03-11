"""
Configuration settings using pydantic-settings
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # App info
    APP_NAME: str = "Matching Service"
    APP_VERSION: str = "1.2"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://matching_user:matching_pass@matching-db:5432/matching_db"
    
    # RabbitMQ
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    
    # JWT Authentication (must match Auth Service settings)
    JWT_SECRET: str = "EduMatch_Super_Secret_Key_!@#_DoNotShare_!@#"
    JWT_ALGORITHM: str = "HS512"
    
    # Celery
    CELERY_BROKER_URL: str = "amqp://guest:guest@rabbitmq:5672//"
    CELERY_RESULT_BACKEND: str = "rpc://"
    
    # ML Settings
    ML_MODEL_PATH: Optional[str] = "/app/models"
    TFIDF_MAX_FEATURES: int = 1000
    TFIDF_MIN_DF: int = 2
    
    # Performance
    RECOMMENDATION_DEFAULT_LIMIT: int = 10
    RECOMMENDATION_MAX_LIMIT: int = 100
    SCORE_CACHE_TTL: int = 300  # 5 minutes
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
