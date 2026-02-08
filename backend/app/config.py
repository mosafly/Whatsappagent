from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # OpenRouter (LLM)
    openrouter_api_key: str

    # OpenAI (Embeddings)
    openai_api_key: str

    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_whatsapp_number: str = "+2250104278080"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Security
    api_secret_key: str = "change-me"
    cors_origins: str = "http://localhost:3000"

    # RAG Config
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "openai/gpt-4o-mini"
    rag_top_k: int = 5
    max_conversation_history: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
