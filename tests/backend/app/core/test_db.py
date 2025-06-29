"""Unit tests for backend/src/app/core/db.py"""

from typing import Any
from unittest.mock import AsyncMock

import pytest
from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import Settings
from app.core.db import DatabaseManager, get_db_manager

__all__: tuple = ()


# noinspection PyPropertyAccess
@pytest.fixture
def mock_settings(mocker: MockerFixture) -> Settings:
    """
    Mocks the Settings object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked Settings object.
    """
    settings: Settings = mocker.create_autospec(spec=Settings, instance=True)
    settings.sqlalchemy_database_uri = "mock://database"
    return settings


@pytest.fixture
def mock_async_engine(mocker: MockerFixture) -> AsyncEngine:
    """
    Mocks the AsyncEngine object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked AsyncEngine object.
    """
    engine: AsyncEngine = mocker.create_autospec(spec=AsyncEngine, instance=True)
    engine.begin.return_value.__aenter__.return_value = AsyncMock()
    engine.begin.return_value.__aexit__.return_value = None
    engine.dispose.return_value = None
    return engine


# noinspection PyUnresolvedReferences
@pytest.fixture
def mock_async_session_factory(mocker: MockerFixture) -> async_sessionmaker[AsyncSession]:
    """
    Mocks the async_sessionmaker object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked async_sessionmaker object.
    """
    session_factory: async_sessionmaker = mocker.create_autospec(spec=async_sessionmaker, instance=True)
    mock_session: AsyncSession = mocker.create_autospec(spec=AsyncSession, instance=True)
    mock_session.close = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session
    session_factory.return_value.__aexit__.return_value = None
    return session_factory


@pytest.mark.asyncio
async def test_database_manager_init(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the initialization of the DatabaseManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mock_create_async_engine: AsyncMock = mocker.patch(
        target="app.core.db.create_async_engine", return_value=mock_async_engine
    )
    mock_async_sessionmaker: AsyncMock = mocker.patch(
        target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory
    )
    db_manager: DatabaseManager = DatabaseManager(settings=mock_settings)
    assert db_manager._async_engine == mock_async_engine
    assert db_manager._async_session_factory == mock_async_session_factory
    mock_create_async_engine.assert_called_once_with(url=mock_settings.sqlalchemy_database_uri)
    mock_async_sessionmaker.assert_called_once_with(bind=mock_async_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_database_manager_engine_property(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the engine property of the DatabaseManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.db.create_async_engine", return_value=mock_async_engine)
    mocker.patch(target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory)
    db_manager: DatabaseManager = DatabaseManager(settings=mock_settings)
    assert db_manager.engine == mock_async_engine


# noinspection PyUnresolvedReferences,PyUnboundLocalVariable
@pytest.mark.asyncio
async def test_database_manager_get_session(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the get_session method of the DatabaseManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.db.create_async_engine", return_value=mock_async_engine)
    mocker.patch(target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory)
    db_manager: DatabaseManager = DatabaseManager(settings=mock_settings)
    async for session in db_manager.get_session():
        assert isinstance(session, AsyncSession)
    mock_async_session_factory.return_value.__aenter__.assert_called_once()
    mock_async_session_factory.return_value.__aexit__.assert_called_once()
    session.close.assert_called_once()


@pytest.mark.asyncio
async def test_database_manager_connect_to_database(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the connect_to_database method of the DatabaseManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.db.create_async_engine", return_value=mock_async_engine)
    mocker.patch(target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory)
    db_manager: DatabaseManager = DatabaseManager(settings=mock_settings)
    await db_manager.connect_to_database()
    mock_async_engine.begin.assert_called_once()
    mock_async_engine.begin.return_value.__aenter__.assert_called_once()
    mock_async_engine.begin.return_value.__aexit__.assert_called_once()
    mock_async_engine.begin.return_value.__aenter__.return_value.run_sync.assert_called_once()


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_database_manager_close_database_connection(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the close_database_connection method of the DatabaseManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.db.create_async_engine", return_value=mock_async_engine)
    mocker.patch(target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory)
    db_manager: DatabaseManager = DatabaseManager(settings=mock_settings)
    await db_manager.close_database_connection()
    mock_async_engine.dispose.assert_called_once()


@pytest.mark.asyncio
async def test_get_db_manager_caching(
    mock_settings: Settings,
    mock_async_engine: AsyncEngine,
    mock_async_session_factory: async_sessionmaker[AsyncSession],
    mocker: MockerFixture,
) -> None:
    """
    Tests the get_db_manager function caching with lru_cache.

    :param mock_settings: Mocked Settings object.
    :param mock_async_engine: Mocked AsyncEngine object.
    :param mock_async_session_factory: Mocked async_sessionmaker object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    get_db_manager.cache_clear()
    mock_get_settings: Any = mocker.patch(target="app.core.db.get_settings", return_value=mock_settings)
    mocker.patch(target="app.core.db.create_async_engine", return_value=mock_async_engine)
    mocker.patch(target="app.core.db.async_sessionmaker", return_value=mock_async_session_factory)
    db_manager1: DatabaseManager = get_db_manager()
    db_manager2: DatabaseManager = get_db_manager()
    assert db_manager1 is db_manager2
    mock_get_settings.assert_called_once()
