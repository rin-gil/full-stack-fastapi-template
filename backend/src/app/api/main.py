from fastapi import APIRouter

from app.api.routes import items, login, users
from app.api.routes.private import private_router
from app.api.routes.utils import utils_router
from app.core.config import get_settings, Settings

settings: Settings = get_settings()

main_router: APIRouter = APIRouter()
main_router.include_router(router=login.router)
main_router.include_router(router=users.router)
main_router.include_router(router=utils_router, prefix="/utils", tags=["utils"])
main_router.include_router(router=items.router)


if settings.ENVIRONMENT == "local":
    main_router.include_router(router=private_router, prefix="/private", tags=["private"])
