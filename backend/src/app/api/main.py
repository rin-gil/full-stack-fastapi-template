"""Module for the main API router class."""

from fastapi import APIRouter

from app.api.routes.items import items_router
from app.api.routes.login import login_router
from app.api.routes.private import private_router
from app.api.routes.users import users_router
from app.api.routes.utils import utils_router
from app.core.config import Settings

__all__: tuple[str, ...] = ("MainRouter",)


class MainRouter:
    """A class that configures and provides the main API router."""

    def __init__(self, settings: Settings) -> None:
        """
        Initializes and configures the main router by including all sub-routers.

        :param settings: The application settings.
        """
        self._router: APIRouter = APIRouter()
        self._settings: Settings = settings
        self._include_routers()

    @property
    def router(self) -> APIRouter:
        """
        Provides access to the configured router instance.

        :return: The configured APIRouter.
        """
        return self._router

    def _include_routers(self) -> None:
        """
        Includes all the necessary sub-routers into the main router.

        :return: None
        """
        self._router.include_router(router=login_router, tags=["login"])
        self._router.include_router(router=users_router, prefix="/users", tags=["users"])
        self._router.include_router(router=utils_router, prefix="/utils", tags=["utils"])
        self._router.include_router(router=items_router, prefix="/items", tags=["items"])
        if self._settings.ENVIRONMENT == "local":
            self._router.include_router(router=private_router, prefix="/private", tags=["private"])
