from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/seo_analyzer"

    # App
    debug: bool = False
    cors_origins: str = "http://localhost:3000"

    # Anthropic
    anthropic_api_key: str = ""

    # Crawler
    max_crawl_depth: int = 3
    max_pages_per_scan: int = 200
    crawl_timeout_seconds: int = 30

    model_config = SettingsConfigDict(
        env_file=str(
            Path(__file__).resolve().parent.parent.parent.parent / ".env"
        ),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
