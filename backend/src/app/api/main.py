from fastapi import APIRouter

from app.api.routes import items, login, users, utils
from app.api.routes.private import private_router
from app.core.config import get_settings, Settings

settings: Settings = get_settings()

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(router=private_router, prefix="/private", tags=["private"])
