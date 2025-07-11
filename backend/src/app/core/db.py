"""Module for managing database connections and sessions."""

from functools import lru_cache
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncEngine
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings, Settings

__all__: tuple[str, ...] = ("DatabaseManager", "get_db_manager")


class DatabaseManager:
    """Manages the database connection, engine, and session factory."""

    def __init__(self, settings: Settings) -> None:
        """
        Initializes the database engine and session factory.

        :param settings: The application settings object.
        """
        self._async_engine: AsyncEngine = create_async_engine(
            url=settings.sqlalchemy_database_uri,
            # --- Recommendations for GENERAL DB (quota ~45 out of 100) ---
            pool_size=3,  # Number of 'persistent' connections per worker.
            max_overflow=2,  # Number of 'additional' connections for peaks.
            pool_pre_ping=True,  # Check the connection before use.
            pool_recycle=1700,  # Recreating 'old' connections.
            pool_timeout=30,  # Waiting time for a free connection. (30 seconds)
        )
        self._async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self._async_engine, class_=AsyncSession, expire_on_commit=False
        )

    @property
    def engine(self) -> AsyncEngine:
        """
        Provides public access to the underlying SQLAlchemy engine. Needed for tasks like creating tables.

        :return: The asynchronous SQLAlchemy engine.
        """
        return self._async_engine

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Dependency to get a new database session for a request.
        The session is managed by a middleware and will be closed automatically.

        :return: An asynchronous generator yielding a new session.
        """
        async with self._async_session_factory() as session:
            yield session

    async def connect_to_database(self) -> None:
        """
        Connects to the database and performs a simple check. To be called on application startup.

        :return: None
        """
        async with self._async_engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: sync_conn.execute(text("SELECT 1")))

    async def close_database_connection(self) -> None:
        """
        Closes the database connection pool. To be called on application shutdown.

        :return: None
        """
        await self._async_engine.dispose()


@lru_cache(maxsize=1)
def get_db_manager() -> DatabaseManager:
    """
    Gets the DatabaseManager object. The lru_cache decorator ensures this function is only called once.

    :return: An instance of DatabaseManager.
    """
    return DatabaseManager(settings=get_settings())
