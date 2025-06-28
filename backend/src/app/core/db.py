"""Module for managing database connections and sessions."""

from functools import lru_cache
from typing import AsyncGenerator

from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncEngine

from app.core.config import get_settings, Settings

__all__: tuple[str, ...] = ("DatabaseManager", "get_db_manager")


class DatabaseManager:
    """Manages the database connection, engine, and session factory."""

    def __init__(self, settings: Settings) -> None:
        """
        Initializes the database engine and session factory.

        :param settings: The application settings object.
        """
        self._async_engine: AsyncEngine = create_async_engine(url=settings.sqlalchemy_database_uri)
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
        Dependency to get a new database session for a request. Ensures the session is always closed.

        :return: An asynchronous generator yielding a new session.
        """
        async with self._async_session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    async def connect_to_database(self) -> None:
        """
        Connects to the database and performs a simple check. To be called on application startup.

        :return: None
        """
        async with self._async_engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: sync_conn.execute("SELECT 1"))

    async def close_database_connection(self) -> None:
        """
        Closes the database connection pool. To be called on application shutdown.

        :return: None
        """
        await self._async_engine.dispose()


@lru_cache
def get_db_manager() -> DatabaseManager:
    """
    Gets the DatabaseManager object. The lru_cache decorator ensures this function is only called once.

    :return: An instance of DatabaseManager.
    """
    return DatabaseManager(settings=get_settings())
