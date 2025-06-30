"""Main application module."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI
from fastapi.routing import APIRoute

# noinspection PyProtectedMember
from loguru._logger import Logger
from starlette.middleware.cors import CORSMiddleware

from app.api.main import MainRouter
from app.core.config import Settings, get_settings
from app.core.db import DatabaseManager, get_db_manager
from app.core.log_setup import get_logger

__all__: tuple = ()

logger: Logger = get_logger()


class AppFactory:
    """A factory class to create and configure the FastAPI application."""

    def __init__(self) -> None:
        """Initializes the AppFactory."""
        self._settings: Settings = get_settings()
        self._db_manager: DatabaseManager = get_db_manager()
        # Creating a dictionary with parameters for FastAPI
        fastapi_params: dict[str, Any] = {
            "title": self._settings.PROJECT_NAME,
            "generate_unique_id_function": self._custom_generate_unique_id,
            "lifespan": self._lifespan,
        }
        # If the environment is not local, disable documentation
        if self._settings.ENVIRONMENT != "local":
            fastapi_params["openapi_url"] = None
            fastapi_params["docs_url"] = None
            fastapi_params["redoc_url"] = None
            fastapi_params["swagger_ui_oauth2_redirect_url"] = None
        else:
            fastapi_params["debug"] = True
            fastapi_params["openapi_url"] = f"{self._settings.API_V1_STR}/openapi.json"
        # Create a FastAPI instance by unpacking the parameter dictionary
        self.app: FastAPI = FastAPI(**fastapi_params)
        self._configure_middleware()
        self._include_routers()

    @staticmethod
    def _custom_generate_unique_id(route: APIRoute) -> str:
        """
        Generates a custom unique ID for each route to improve client generation.

        :param route: The APIRoute object.
        :return: A string representing the unique ID.
        """
        return f"{route.tags[0]}-{route.name}"

    @asynccontextmanager
    async def _lifespan(self, _: FastAPI) -> AsyncGenerator[None, None]:
        """
        Manages the application's lifespan events for database connections.

        :param _: The FastAPI application instance.
        """
        logger.info("Connecting to the database.")
        await self._db_manager.connect_to_database()
        yield
        logger.info("Closing the database connection.")
        await self._db_manager.close_database_connection()

    def _configure_middleware(self) -> None:
        """
        Configures and adds CORS middleware to the application.

        :return: None
        """
        if self._settings.all_cors_origins:
            self.app.add_middleware(
                middleware_class=CORSMiddleware,  # type: ignore
                allow_origins=[str(origin) for origin in self._settings.all_cors_origins],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )

    def _include_routers(self) -> None:
        """
        Includes the main API router into the application.

        :return: None
        """
        main_router: MainRouter = MainRouter(settings=self._settings)
        self.app.include_router(router=main_router.router, prefix=self._settings.API_V1_STR)


app: FastAPI = AppFactory().app
