"""Unit tests for backend/src/app/main.py"""

# pylint: disable=protected-access
# pylint: disable=redefined-outer-name

from typing import Any
from unittest.mock import AsyncMock, MagicMock, call

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from pytest_mock import MockerFixture
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from app.api.main import MainRouter
from app.core.config import Settings

# noinspection PyProtectedMember
from app.main import AppFactory

__all__: tuple = ()


@pytest.fixture
def mock_dependencies(mocker: MockerFixture) -> dict[str, Any]:
    """
    Fixture to mock all external dependencies for AppFactory.

    :param mocker: Pytest mocker fixture.
    :return: A dictionary of mocked dependencies.
    """
    mock_settings: Settings = MagicMock(
        spec=Settings,
        ENVIRONMENT="local",
        PROJECT_NAME="TestProject",
        API_V1_STR="/api/v1",
        all_cors_origins=["http://example.com"],
    )
    mock_db_manager: AsyncMock = AsyncMock()
    mock_logger: MagicMock = mocker.patch(target="app.main.logger")
    mock_router_instance: MainRouter = MagicMock(spec=MainRouter, router=APIRouter())
    mock_main_router_class: MagicMock = mocker.patch(target="app.main.MainRouter", return_value=mock_router_instance)
    mocker.patch(target="app.main.get_settings", return_value=mock_settings)
    mocker.patch(target="app.main.get_db_manager", return_value=mock_db_manager)
    return {
        "settings": mock_settings,
        "db_manager": mock_db_manager,
        "logger": mock_logger,
        "main_router_class": mock_main_router_class,
        "main_router_instance": mock_router_instance,
    }


# noinspection PyUnresolvedReferences
def test_app_factory_initialization_local_environment(mock_dependencies: dict[str, Any]) -> None:
    """
    Test the initialization of AppFactory with ENVIRONMENT set to 'local'.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    settings: Settings = mock_dependencies["settings"]
    app_factory: AppFactory = AppFactory()
    assert isinstance(app_factory.app, FastAPI)
    assert app_factory.app.title == settings.PROJECT_NAME
    assert app_factory.app.debug is True
    assert app_factory.app.openapi_url == f"{settings.API_V1_STR}/openapi.json"


# noinspection PyPep8Naming,PyUnresolvedReferences
def test_app_factory_initialization_non_local_environment(mock_dependencies: dict[str, Any]) -> None:
    """
    Test the initialization of AppFactory with ENVIRONMENT set to 'production'.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    mock_dependencies["settings"].ENVIRONMENT = "production"
    app_factory: AppFactory = AppFactory()
    assert isinstance(app_factory.app, FastAPI)
    assert app_factory.app.debug is False
    assert app_factory.app.openapi_url is None
    assert app_factory.app.docs_url is None
    assert app_factory.app.redoc_url is None


def test_custom_generate_unique_id() -> None:
    """
    Test the _custom_generate_unique_id method for generating route IDs.

    :return: None
    """
    route: APIRoute = MagicMock(spec=APIRoute)
    route.name = "get_users"
    route.tags = ["users"]
    unique_id: str = AppFactory._custom_generate_unique_id(route=route)
    assert unique_id == "users-get_users"


@pytest.mark.asyncio
async def test_lifespan(mock_dependencies: dict[str, Any]) -> None:
    """
    Test the _lifespan method for managing database connections.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    db_manager: AsyncMock = mock_dependencies["db_manager"]
    logger: MagicMock = mock_dependencies["logger"]
    app_factory: AppFactory = AppFactory()
    async with app_factory._lifespan(_=app_factory.app):
        db_manager.connect_to_database.assert_awaited_once()
    db_manager.close_database_connection.assert_awaited_once()
    expected_calls: list = [call("Connecting to the database."), call("Closing the database connection.")]
    logger.info.assert_has_calls(expected_calls, any_order=False)


# noinspection PyUnresolvedReferences
def test_configure_middleware_with_cors_origins(mock_dependencies: dict[str, Any]) -> None:
    """
    Test the _configure_middleware method when CORS origins are provided.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    settings: Settings = mock_dependencies["settings"]
    app_factory: AppFactory = AppFactory()
    cors_middleware: Middleware = app_factory.app.user_middleware[0]
    assert cors_middleware.cls == CORSMiddleware
    assert cors_middleware.kwargs["allow_origins"] == settings.all_cors_origins
    assert cors_middleware.kwargs["allow_credentials"] is True


# noinspection PyUnresolvedReferences
def test_configure_middleware_without_cors_origins(mock_dependencies: dict[str, Any]) -> None:
    """
    Test the _configure_middleware method when no CORS origins are provided.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    mock_dependencies["settings"].all_cors_origins = []
    app_factory: AppFactory = AppFactory()
    assert not any(m.cls == CORSMiddleware for m in app_factory.app.user_middleware)


def test_include_routers(mock_dependencies: dict[str, Any], mocker: MockerFixture) -> None:
    """
    Test the _include_routers method to ensure the main router is included.

    :param mock_dependencies: The mocked dependencies fixture.
    :param mocker: Pytest mocker fixture for spying on the app.
    :return: None
    """
    spy: MagicMock = mocker.spy(obj=FastAPI, name="include_router")
    app_factory: AppFactory = AppFactory()
    settings: Settings = mock_dependencies["settings"]
    main_router_class_mock: MagicMock = mock_dependencies["main_router_class"]
    main_router_instance_mock: MainRouter = mock_dependencies["main_router_instance"]
    main_router_class_mock.assert_called_once_with(settings=settings)
    spy.assert_called_once_with(app_factory.app, router=main_router_instance_mock.router, prefix=settings.API_V1_STR)
