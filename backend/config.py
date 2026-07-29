from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str
    test_database_url: str
    jwt_secret_key: str
    media_root: str = str(Path(__file__).resolve().parent.parent / "media")
    media_base_url: str = "http://localhost:8000/media"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
    )


settings = Settings()
