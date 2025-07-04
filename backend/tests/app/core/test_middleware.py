"""Unit tests for backend/src/app/core/middleware.py"""

# pylint: disable=redefined-outer-name

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from pytest_mock import MockerFixture
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import Settings
from app.core.db import DatabaseManager

# noinspection PyProtectedMember
from app.core.middleware import DbSessionMiddleware, MiddlewareConfigurator

__all__: tuple = ()


@pytest.fixture
def mock_app(mocker: MockerFixture) -> MagicMock:
    """
    Mocks the FastAPI application object.

    :param mocker: Pytest mocker fixture.
    :return: A mocked FastAPI application.
    """
    return mocker.create_autospec(spec=FastAPI, instance=True)


@pytest.fixture
def mock_settings(mocker: MockerFixture) -> MagicMock:
    """
    Mocks the Settings object.

    :param mocker: Pytest mocker fixture.
    :return: A mocked Settings object.
    """
    return mocker.create_autospec(spec=Settings, instance=True)


@pytest.fixture
def mock_session() -> AsyncMock:
    """
    Provides a reusable mock for the session object.

    :return: Mocked session.
    """
    return AsyncMock()


@pytest.fixture
def mock_db_manager(mocker: MockerFixture, mock_session: AsyncMock) -> MagicMock:
    """
    Mocks the DatabaseManager object with a properly mocked async generator.

    :param mocker: Pytest mocker fixture.
    :param mock_session: The mocked session fixture.
    :return: A mocked DatabaseManager object.
    """
    db_manager: MagicMock = mocker.create_autospec(DatabaseManager, instance=True)
    mock_generator: AsyncMock = AsyncMock()
    mock_generator.__anext__.return_value = mock_session
    db_manager.get_session.return_value = mock_generator
    return db_manager


@pytest.fixture
def mock_request(mocker: MockerFixture) -> MagicMock:
    """
    Mocks the Request object.

    :param mocker: Pytest mocker fixture.
    :return: A mocked Request object.
    """
    return mocker.create_autospec(Request, instance=True)


@pytest.fixture
def mock_call_next(mocker: MockerFixture) -> AsyncMock:
    """
    Mocks the call_next function.

    :param mocker: Pytest mocker fixture.
    :return: An async mock for the call_next function.
    """
    return AsyncMock(return_value=mocker.create_autospec(Response, instance=True))


@pytest.mark.asyncio
async def test_db_session_middleware_happy_path(
    mock_app: MagicMock,
    mock_db_manager: MagicMock,
    mock_session: AsyncMock,
    mock_request: MagicMock,
    mock_call_next: AsyncMock,
) -> None:
    """
    Tests the DbSessionMiddleware dispatch method in a successful scenario.

    :param mock_app: Mocked FastAPI application.
    :param mock_db_manager: Mocked DatabaseManager.
    :param mock_session: The mocked session object.
    :param mock_request: Mocked Request object.
    :param mock_call_next: Mocked call_next function.
    :return: None
    """
    middleware: DbSessionMiddleware = DbSessionMiddleware(app=mock_app, db_manager=mock_db_manager)
    await middleware.dispatch(request=mock_request, call_next=mock_call_next)
    mock_db_manager.get_session.assert_called_once()
    mock_call_next.assert_awaited_once_with(mock_request)
    mock_session.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_db_session_middleware_closes_on_exception(
    mock_app: MagicMock,
    mock_db_manager: MagicMock,
    mock_session: AsyncMock,
    mock_request: MagicMock,
    mock_call_next: AsyncMock,
) -> None:
    """
    Tests that DbSessionMiddleware closes the session even if an exception occurs.

    :param mock_app: Mocked FastAPI application.
    :param mock_db_manager: Mocked DatabaseManager.
    :param mock_session: The mocked session object.
    :param mock_request: Mocked Request object.
    :param mock_call_next: Mocked call_next function.
    :return: None
    """
    mock_call_next.side_effect = ValueError("Something went wrong")
    middleware: DbSessionMiddleware = DbSessionMiddleware(app=mock_app, db_manager=mock_db_manager)
    with pytest.raises(expected_exception=ValueError, match="Something went wrong"):
        await middleware.dispatch(request=mock_request, call_next=mock_call_next)
    mock_db_manager.get_session.assert_called_once()
    mock_call_next.assert_awaited_once_with(mock_request)
    mock_session.close.assert_awaited_once()


@pytest.mark.parametrize(
    "cors_origins, expected_call_count",
    [(["http://example.com", "http://localhost:5173"], 2), ([], 1)],
    ids=["With CORS origins", "Without CORS origins"],
)
def test_middleware_configurator(
    mock_app: MagicMock,
    mock_settings: MagicMock,
    mock_db_manager: MagicMock,
    cors_origins: list[str],
    expected_call_count: int,
) -> None:
    """
    Tests that MiddlewareConfigurator correctly adds middleware based on CORS settings.

    :param mock_app: Mocked FastAPI application.
    :param mock_settings: Mocked Settings object.
    :param mock_db_manager: Mocked DatabaseManager.
    :param cors_origins: A list of CORS origins to be tested.
    :param expected_call_count: The number of expected calls to `add_middleware`.
    :return: None
    """
    mock_settings.all_cors_origins = cors_origins
    configurator: MiddlewareConfigurator = MiddlewareConfigurator(
        app=mock_app, settings=mock_settings, db_manager=mock_db_manager
    )
    configurator.add_all_middleware()
    assert mock_app.add_middleware.call_count == expected_call_count
    mock_app.add_middleware.assert_any_call(DbSessionMiddleware, db_manager=mock_db_manager)
    if cors_origins:
        mock_app.add_middleware.assert_called_with(
            middleware_class=CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
