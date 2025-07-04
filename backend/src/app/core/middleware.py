"""Module for configuring application middleware."""

from collections.abc import AsyncGenerator, Awaitable, Callable

from fastapi import FastAPI
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import Settings
from app.core.db import DatabaseManager

__all__: tuple[str, ...] = ("MiddlewareConfigurator",)


class DbSessionMiddleware(BaseHTTPMiddleware):
    """Middleware for managing database sessions per request."""

    def __init__(self, app: FastAPI, db_manager: DatabaseManager) -> None:
        """
        Initializes the middleware.

        :param app: The ASGI application.
        :param db_manager: The database manager instance.
        """
        super().__init__(app)
        self.db_manager: DatabaseManager = db_manager

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """
        Handles the request and ensures session management.

        :param request: The incoming HTTP request.
        :param call_next: The function to call to process the request.
        :return: The HTTP response.
        """
        session_generator: AsyncGenerator[AsyncSession, None] = self.db_manager.get_session()
        session: AsyncSession = await anext(session_generator)
        try:
            response: Response = await call_next(request)
        finally:
            await session.close()
        return response


class MiddlewareConfigurator:
    """A class to configure and add all middleware to the application."""

    def __init__(self, app: FastAPI, settings: Settings, db_manager: DatabaseManager) -> None:
        """
        Initializes the MiddlewareConfigurator.

        :param app: The FastAPI application instance.
        :param settings: The application settings.
        :param db_manager: The database manager instance.
        """
        self._app: FastAPI = app
        self._settings: Settings = settings
        self._db_manager: DatabaseManager = db_manager

    def add_all_middleware(self) -> None:
        """
        Adds all configured middleware to the application.

        :return: None
        """
        self._app.add_middleware(
            middleware_class=DbSessionMiddleware, db_manager=self._db_manager  # type: ignore[arg-type]
        )
        if self._settings.all_cors_origins:
            self._app.add_middleware(
                middleware_class=CORSMiddleware,
                allow_origins=[str(origin) for origin in self._settings.all_cors_origins],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
