from datetime import timedelta

from authx import AuthX, AuthXConfig

from backend.config import settings


auth_config = AuthXConfig(
    JWT_SECRET_KEY=settings.jwt_secret_key,
    JWT_ACCESS_COOKIE_NAME="access_token",
    JWT_TOKEN_LOCATION=["cookies", "headers"],
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),

)

auth = AuthX(config=auth_config)