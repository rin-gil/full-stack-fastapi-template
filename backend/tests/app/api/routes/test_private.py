# type: ignore
"""Unit tests for backend/src/app/api/routes/private.py"""

# pylint: disable=protected-access
# pylint: disable=redefined-outer-name

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException, BackgroundTasks

# noinspection PyProtectedMember
from app.api.routes.private import PrivateRouter
from app.core.config import Settings
from app.core.emails import EmailManager
from app.crud.user import UserCRUD
from app.models import UserCreate, User

__all__: tuple = ()


@pytest.fixture
def mock_user_crud() -> UserCRUD:
    """
    Fixture to create a mock UserCRUD dependency.

    :return: Mocked UserCRUD instance.
    """
    return AsyncMock(spec=UserCRUD)


@pytest.fixture
def mock_email_manager() -> EmailManager:
    """
    Fixture to create a mock EmailManager dependency.

    :return: Mocked EmailManager instance.
    """
    return AsyncMock(spec=EmailManager)


@pytest.fixture
def mock_settings() -> Settings:
    """
    Fixture to create a mock Settings dependency.

    :return: Mocked Settings instance.
    """
    return MagicMock(spec=Settings)


@pytest.fixture
def private_router(
    mock_user_crud: UserCRUD, mock_email_manager: EmailManager, mock_settings: Settings
) -> PrivateRouter:
    """
    Fixture to create a PrivateRouter instance with mocked dependencies.

    :param mock_user_crud: Mocked UserCRUD dependency.
    :param mock_email_manager: Mocked EmailManager dependency.
    :param mock_settings: Mocked Settings dependency.
    :return: Mocked PrivateRouter instance.
    """
    return PrivateRouter(user_crud=mock_user_crud, email_manager=mock_email_manager, settings=mock_settings)


@pytest.mark.asyncio
async def test_create_user_initialization(
    mock_user_crud: UserCRUD, mock_email_manager: EmailManager, mock_settings: Settings
) -> None:
    """
    Test the initialization of PrivateRouter with correct dependencies.

    :param mock_user_crud: Mocked UserCRUD dependency.
    :param mock_email_manager: Mocked EmailManager dependency.
    :param mock_settings: Mocked Settings dependency.
    :return: None
    """
    router: PrivateRouter = PrivateRouter(
        user_crud=mock_user_crud, email_manager=mock_email_manager, settings=mock_settings
    )
    assert router._user_crud == mock_user_crud
    assert router._email_manager == mock_email_manager
    assert router._settings == mock_settings


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "emails_enabled,existing_user,should_send_email",
    [(True, None, True), (False, None, False), (True, User(id=1, email="test@example.com"), False)],
    ids=["emails_enabled_no_existing_user", "emails_disabled_no_existing_user", "existing_user"],
)
async def test_create_user(
    private_router: PrivateRouter,
    mock_user_crud: UserCRUD,
    mock_email_manager: EmailManager,
    mock_settings: Settings,
    emails_enabled: bool,
    existing_user: User | None,
    should_send_email: bool,
) -> None:
    """
    Test the create_user endpoint for various scenarios.

    :param private_router: The PrivateRouter instance to test.
    :param mock_user_crud: Mocked UserCRUD dependency.
    :param mock_email_manager: Mocked EmailManager dependency.
    :param mock_settings: Mocked Settings dependency.
    :param emails_enabled: Whether email sending is enabled.
    :param existing_user: Existing user object or None.
    :param should_send_email: Whether an email should be sent.
    :return: None
    """
    # Arrange
    user_in: UserCreate = UserCreate(email="test@example.com", password="password123")
    created_user: User = User(id=1, email=user_in.email)
    mock_settings.emails_enabled = emails_enabled
    mock_user_crud.get_by_email.return_value = existing_user
    mock_user_crud.create.return_value = created_user
    background_tasks: BackgroundTasks = BackgroundTasks()
    background_tasks.add_task = MagicMock()
    if existing_user:
        # Act & Assert
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await private_router.create_user(user_in=user_in, background_tasks=background_tasks)
        assert exc_info.value.status_code == 400
        assert "already exists" in exc_info.value.detail
        mock_user_crud.create.assert_not_called()
        background_tasks.add_task.assert_not_called()
    else:
        result: User = await private_router.create_user(user_in=user_in, background_tasks=background_tasks)
        mock_user_crud.get_by_email.assert_called_once_with(email=user_in.email)
        mock_user_crud.create.assert_called_once_with(user_create=user_in)
        assert result == created_user
        if should_send_email:
            background_tasks.add_task.assert_called_once_with(
                func=mock_email_manager.send_new_account_email,
                email_to=user_in.email,
                username=user_in.email,
                password=user_in.password,
            )
        else:
            background_tasks.add_task.assert_not_called()
