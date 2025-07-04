"""Unit tests for backend/src/app/main.py"""

# pylint: disable=protected-access
# pylint: disable=redefined-outer-name

from typing import Any
from unittest.mock import AsyncMock, MagicMock, call

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from pytest_mock import MockerFixture

from app.api.main import MainRouter
from app.core.config import Settings
from app.core.middleware import MiddlewareConfigurator

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
        spec=Settings, ENVIRONMENT="local", PROJECT_NAME="TestProject", API_V1_STR="/api/v1"
    )
    mock_db_manager: AsyncMock = AsyncMock()
    mock_logger: MagicMock = mocker.patch(target="app.main.logger")
    # Mock the MiddlewareConfigurator
    mock_configurator_instance: MagicMock = MagicMock(spec=MiddlewareConfigurator)
    mock_configurator_class: MagicMock = mocker.patch(
        target="app.main.MiddlewareConfigurator", return_value=mock_configurator_instance
    )
    # Mock the MainRouter
    mock_router_instance: MainRouter = MagicMock(spec=MainRouter, router=APIRouter())
    mock_router_class: MagicMock = mocker.patch(target="app.main.MainRouter", return_value=mock_router_instance)
    # Mock the dependency getters
    mocker.patch(target="app.main.get_settings", return_value=mock_settings)
    mocker.patch(target="app.main.get_db_manager", return_value=mock_db_manager)
    return {
        "settings": mock_settings,
        "db_manager": mock_db_manager,
        "logger": mock_logger,
        "middleware_configurator_class": mock_configurator_class,
        "middleware_configurator_instance": mock_configurator_instance,
        "main_router_class": mock_router_class,
        "main_router_instance": mock_router_instance,
    }


# noinspection PyUnusedLocal
def test_app_factory_initialization_flow(mock_dependencies: dict[str, Any], mocker: MockerFixture) -> None:
    """
    Test the initialization flow of AppFactory, ensuring all components are configured correctly.

    :param mock_dependencies: The mocked dependencies fixture.
    :param mocker: Pytest mocker fixture.
    :return: None
    """
    # Spy on the FastAPI apps include_router method to verify it's called
    spy_include_router: MagicMock = mocker.spy(obj=FastAPI, name="include_router")
    # Get mocked components from the fixture
    settings: Settings = mock_dependencies["settings"]
    db_manager: AsyncMock = mock_dependencies["db_manager"]
    middleware_configurator_class: MagicMock = mock_dependencies["middleware_configurator_class"]
    middleware_configurator_instance: MagicMock = mock_dependencies["middleware_configurator_instance"]
    main_router_class: MagicMock = mock_dependencies["main_router_class"]
    main_router_instance: MainRouter = mock_dependencies["main_router_instance"]
    # Initialize the AppFactory
    app_factory: AppFactory = AppFactory()
    # Assert MiddlewareConfigurator was initialized and used
    middleware_configurator_class.assert_called_once_with(app=app_factory.app, settings=settings, db_manager=db_manager)
    middleware_configurator_instance.add_all_middleware.assert_called_once()
    # Assert MainRouter was initialized
    main_router_class.assert_called_once_with(settings=settings)
    # Assert the router was included in the app
    spy_include_router.assert_called_once_with(
        app_factory.app, router=main_router_instance.router, prefix=settings.API_V1_STR
    )


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
async def test_lifespan(mock_dependencies: dict[str, Any], mocker: MockerFixture) -> None:
    """
    Test the _lifespan method for managing database connections.

    :param mock_dependencies: The mocked dependencies fixture.
    :return: None
    """
    db_manager: AsyncMock = mock_dependencies["db_manager"]
    logger: MagicMock = mock_dependencies["logger"]
    # Since __init__ calls our dependencies, we need to re-patch for this specific test's AppFactory instance
    mocker.patch(target="app.main.MiddlewareConfigurator")
    mocker.patch(target="app.main.MainRouter")
    app_factory: AppFactory = AppFactory()
    async with app_factory._lifespan(_=app_factory.app):
        db_manager.connect_to_database.assert_awaited_once()
    db_manager.close_database_connection.assert_awaited_once()
    expected_calls: list = [call("Connecting to the database."), call("Closing the database connection.")]
    logger.info.assert_has_calls(expected_calls, any_order=False)
