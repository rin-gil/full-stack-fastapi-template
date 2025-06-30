"""Unit tests for backend/src/app/api/main.py"""

from unittest.mock import MagicMock

from fastapi import APIRouter

from app.api.main import MainRouter
from app.core.config import Settings

__all__: tuple = ()


def test_main_router_initialization_local_environment() -> None:
    """
    Test the initialization of MainRouter with ENVIRONMENT set to 'local'.

    :return: None
    """
    settings: Settings = MagicMock(spec=Settings, ENVIRONMENT="local")
    main_router: MainRouter = MainRouter(settings=settings)
    assert isinstance(main_router.router, APIRouter)
    assert main_router._settings == settings
    # Verify that the routes have been added. The exact number depends on the endpoints.
    assert len(main_router.router.routes) > 0


def test_main_router_initialization_non_local_environment() -> None:
    """
    Test the initialization of MainRouter with ENVIRONMENT set to 'production'.

    :return: None
    """
    settings: Settings = MagicMock(spec=Settings, ENVIRONMENT="production")
    main_router: MainRouter = MainRouter(settings=settings)
    assert isinstance(main_router.router, APIRouter)
    assert main_router._settings == settings
    # Verify that the routes have been added. The exact number depends on the endpoints.
    assert len(main_router.router.routes) > 0


def test_main_router_include_routers() -> None:
    """
    Test the _include_routers method to ensure all routers are included correctly.

    :return: None
    """
    settings: Settings = MagicMock(spec=Settings, ENVIRONMENT="local")
    main_router: MainRouter = MainRouter(settings=settings)
    router: APIRouter = main_router.router
    # Check the .path and .tags attributes for end routes (APIRoute).
    all_paths: set = {route.path for route in router.routes}
    all_tags: set = {tag for route in router.routes for tag in route.tags}
    # Check that there are paths starting with the desired prefixes
    assert any(path.startswith("/users") for path in all_paths)
    assert any(path.startswith("/utils") for path in all_paths)
    assert any(path.startswith("/items") for path in all_paths)
    assert any(path.startswith("/private") for path in all_paths)
    # Check the all tags
    assert "login" in all_tags
    assert "users" in all_tags
    assert "utils" in all_tags
    assert "items" in all_tags
    assert "private" in all_tags


def test_main_router_include_routers_non_local() -> None:
    """
    Test the _include_routers method with ENVIRONMENT set to 'production' to exclude private router.

    :return: None
    """
    settings: Settings = MagicMock(spec=Settings, ENVIRONMENT="production")
    main_router: MainRouter = MainRouter(settings=settings)
    router: APIRouter = main_router.router
    # Check the .path and .tags attributes for end routes (APIRoute).
    all_paths: set = {route.path for route in router.routes}
    all_tags: set = {tag for route in router.routes for tag in route.tags}
    # Check that the necessary routers are available
    assert any(path.startswith("/users") for path in all_paths)
    assert any(path.startswith("/utils") for path in all_paths)
    assert any(path.startswith("/items") for path in all_paths)
    # Make sure that the private router is NOT turned on.
    assert not any(path.startswith("/private") for path in all_paths)
    # Check the all tags
    assert "login" in all_tags
    assert "users" in all_tags
    assert "utils" in all_tags
    assert "items" in all_tags
    assert "private" not in all_tags
