"""Unit tests for backend/src/app/api/routes/utils.py"""

# pylint: disable=redefined-outer-name

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import BackgroundTasks
from pydantic.networks import EmailStr

# noinspection PyProtectedMember
from app.api.routes.utils import UtilsRouter
from app.core.emails import EmailManager
from app.models import Message

__all__: tuple = ()


@pytest.fixture
def mock_email_manager() -> EmailManager:
    """
    Fixture to create a mock EmailManager dependency.

    :return: Mocked EmailManager instance.
    """
    return AsyncMock(spec=EmailManager)


@pytest.fixture
def mock_current_superuser() -> None:
    """
    Fixture to create a mock CurrentSuperuser dependency.

    :return: Mocked CurrentSuperuser instance (None for simplicity).
    """
    return None


@pytest.fixture
def utils_router(mock_email_manager: EmailManager) -> UtilsRouter:
    """
    Fixture to create a UtilsRouter instance with mocked dependencies.

    :param mock_email_manager: Mocked EmailManager dependency.
    :return: Mocked UtilsRouter instance.
    """
    return UtilsRouter()


# noinspection PyProtectedMember
@pytest.mark.asyncio
async def test_utils_router_initialization(mock_email_manager: EmailManager) -> None:
    """
    Test the initialization of UtilsRouter with no dependencies.

    :param mock_email_manager: Mocked EmailManager dependency.
    :return: None
    """
    router: UtilsRouter = UtilsRouter()
    assert isinstance(router, UtilsRouter)


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "email_to", ["test@example.com", "user@domain.org"], ids=["standard_email", "alternative_email"]
)
async def test_test_email(
    utils_router: UtilsRouter, mock_email_manager: EmailManager, mock_current_superuser: None, email_to: EmailStr
) -> None:
    """
    Test the test_email endpoint for various scenarios.

    :param utils_router: The UtilsRouter instance to test.
    :param mock_email_manager: Mocked EmailManager dependency.
    :param mock_current_superuser: Mocked CurrentSuperuser dependency.
    :param email_to: The email address to send the test email to.
    :return: None
    """
    background_tasks: BackgroundTasks = BackgroundTasks()
    background_tasks.add_task = MagicMock()  # type: ignore
    result: Message = await utils_router.test_email(
        email_to=email_to,
        background_tasks=background_tasks,
        email_manager=mock_email_manager,
        _=mock_current_superuser,  # type: ignore
    )
    background_tasks.add_task.assert_called_once_with(func=mock_email_manager.send_test_email, email_to=email_to)
    assert result == Message(message="Test email sent")


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
async def test_health_check(utils_router: UtilsRouter) -> None:
    """
    Test the health_check endpoint.

    :param utils_router: The UtilsRouter instance to test.
    :return: None
    """
    result: Message = await utils_router.health_check()
    assert result == Message(message="Ok")
