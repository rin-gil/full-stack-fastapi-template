from fastapi import APIRouter

from app.api.routes import private, items, login, users, utils
from app.core.config import get_settings, Settings

settings: Settings = get_settings()

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
