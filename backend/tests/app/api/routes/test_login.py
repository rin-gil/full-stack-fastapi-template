"""Unit tests for backend/src/app/api/routes/login.py"""

# pylint: disable=protected-access

import asyncio
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse
from pytest_mock import MockerFixture

from app.api.deps import UserCrudDep

# noinspection PyProtectedMember
from app.api.routes.login import LoginRouter
from app.core.config import Settings
from app.core.emails import EmailManager
from app.core.security import SecurityManager
from app.models import Message, NewPassword, Token, User, UserPublic, UserUpdate

__all__: tuple = ()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user_exists,is_active,raises_exception,expected_status,expected_detail",
    [
        (True, True, False, None, None),
        (False, True, True, 400, "Incorrect email or password"),
        (True, False, True, 400, "Inactive user"),
    ],
    ids=["success", "invalid_credentials", "inactive_user"],
)
async def test_login_access_token(
    mocker: MockerFixture,
    user_exists: bool,
    is_active: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the login_access_token endpoint for various scenarios.

    :param mocker: Pytest mocker fixture.
    :param user_exists: Whether the user exists.
    :param is_active: Whether the user is active.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    security_manager_mock: AsyncMock = AsyncMock(spec=SecurityManager)
    settings_mock: MagicMock = MagicMock(spec=Settings, ACCESS_TOKEN_EXPIRE_MINUTES=60)
    form_data_mock: MagicMock = MagicMock(username="user@example.com", password="password123")
    user: User = User(id=uuid4(), email="user@example.com", is_active=is_active, is_superuser=False, full_name=None)
    future_authenticate: asyncio.Future = asyncio.Future()
    future_authenticate.set_result(user if user_exists else None)
    user_crud_mock.authenticate.return_value = future_authenticate
    access_token: str = "mocked_token"
    security_manager_mock.create_access_token.return_value = access_token
    login_router: LoginRouter = LoginRouter()
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await login_router.login_access_token(
                form_data=form_data_mock,
                user_crud=user_crud_mock,
                security_manager=security_manager_mock,
                settings=settings_mock,
            )
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Token = await login_router.login_access_token(
            form_data=form_data_mock,
            user_crud=user_crud_mock,
            security_manager=security_manager_mock,
            settings=settings_mock,
        )
        user_crud_mock.authenticate.assert_called_once_with(
            email=form_data_mock.username, password=form_data_mock.password
        )
        security_manager_mock.create_access_token.assert_called_once_with(
            subject=str(user.id), expires_delta=timedelta(minutes=settings_mock.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        assert result == Token(access_token=access_token)


@pytest.mark.asyncio
async def test_test_token() -> None:
    """
    Test the test_token endpoint.

    :return: None
    """
    current_user: UserPublic = UserPublic(
        id=uuid4(), email="user@example.com", is_active=True, is_superuser=False, full_name=None
    )
    login_router: LoginRouter = LoginRouter()
    result: User = await login_router.test_token(current_user=current_user)  # type: ignore
    assert result == current_user


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "environment, user_exists, raises_exception, expected_detail_or_message, email_task_called",
    [
        ("local", True, False, "Password recovery email sent", True),
        ("local", False, True, "The user with this email does not exist in the system. (Local env only)", False),
        ("production", True, False, "If an account with that email exists, a recovery email has been sent.", True),
        ("production", False, False, "If an account with that email exists, a recovery email has been sent.", False),
    ],
    ids=["local_success", "local_not_found_raises", "prod_success_safe", "prod_not_found_safe"],
)
async def test_recover_password(
    environment: str,
    user_exists: bool,
    raises_exception: bool,
    expected_detail_or_message: str,
    email_task_called: bool,
) -> None:
    """
    Test the recover_password endpoint for various scenarios and environments.

    :param environment: The simulated application environment.
    :param user_exists: Whether the user is mocked to exist.
    :param raises_exception: Whether an HTTPException is expected.
    :param expected_detail_or_message: The expected detail for exceptions or message for success.
    :param email_task_called: Whether the email sending task should be called.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    email_manager_mock: AsyncMock = AsyncMock(spec=EmailManager)
    background_tasks_mock: MagicMock = MagicMock(spec=BackgroundTasks)
    settings_mock: MagicMock = MagicMock(spec=Settings, ENVIRONMENT=environment)
    email: str = "user@example.com"
    user: User = User(id=uuid4(), email=email, is_active=True, is_superuser=False, full_name=None)
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(user if user_exists else None)
    user_crud_mock.get_by_email.return_value = future_get
    login_router: LoginRouter = LoginRouter()
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await login_router.recover_password(
                email=email,
                user_crud=user_crud_mock,
                email_manager=email_manager_mock,
                background_tasks=background_tasks_mock,
                settings=settings_mock,
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == expected_detail_or_message
        background_tasks_mock.add_task.assert_not_called()
    else:
        result: Message = await login_router.recover_password(
            email=email,
            user_crud=user_crud_mock,
            email_manager=email_manager_mock,
            background_tasks=background_tasks_mock,
            settings=settings_mock,
        )
        user_crud_mock.get_by_email.assert_called_once_with(email=email)
        assert result.message == expected_detail_or_message
        if email_task_called:
            background_tasks_mock.add_task.assert_called_once_with(
                email_manager_mock.send_reset_password_email, email_to=email
            )
        else:
            background_tasks_mock.add_task.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token_valid,user_exists,is_active,raises_exception,expected_status,expected_detail",
    [
        (True, True, True, False, None, None),
        (False, True, True, True, 400, "Invalid token"),
        (True, False, True, True, 404, "The user with this email does not exist in the system."),
        (True, True, False, True, 400, "Inactive user"),
    ],
    ids=["success", "invalid_token", "user_not_found", "inactive_user"],
)
async def test_reset_password(
    token_valid: bool,
    user_exists: bool,
    is_active: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the reset_password endpoint for various scenarios.

    :param token_valid: Whether the token is valid.
    :param user_exists: Whether the user exists.
    :param is_active: Whether the user is active.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    email_manager_mock: AsyncMock = AsyncMock(spec=EmailManager)
    email: str = "user@example.com"
    token: str = "valid_token"
    body: NewPassword = NewPassword(token=token, new_password="new_password123")
    user: User = User(id=uuid4(), email=email, is_active=is_active, is_superuser=False, full_name=None)
    email_manager_mock.verify_password_reset_token.return_value = email if token_valid else None
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(user if user_exists else None)
    user_crud_mock.get_by_email.return_value = future_get
    future_update: asyncio.Future = asyncio.Future()
    future_update.set_result(user)
    user_crud_mock.update.return_value = future_update
    login_router: LoginRouter = LoginRouter()
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await login_router.reset_password(body=body, user_crud=user_crud_mock, email_manager=email_manager_mock)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Message = await login_router.reset_password(
            body=body, user_crud=user_crud_mock, email_manager=email_manager_mock
        )
        email_manager_mock.verify_password_reset_token.assert_called_once_with(token=body.token)
        user_crud_mock.get_by_email.assert_called_once_with(email=email)
        user_crud_mock.update.assert_called_once_with(db_user=user, user_in=UserUpdate(password=body.new_password))
        assert result == Message(message="Password updated successfully")


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_recover_password_html_content() -> None:
    """
    Test the recover_password_html_content endpoint.

    :return: None
    """
    email_manager_mock: AsyncMock = AsyncMock(spec=EmailManager)
    email: str = "user@example.com"
    current_superuser: UserPublic = UserPublic(
        id=uuid4(), email="superuser@example.com", is_active=True, is_superuser=True, full_name=None
    )
    token: str = "reset_token"
    email_manager_mock.generate_password_reset_token.return_value = token
    html_content: str = "<html>Reset Password Link</html>"
    settings_mock: MagicMock = MagicMock(
        spec=Settings, PROJECT_NAME="TestProject", FRONTEND_HOST="http://frontend", EMAIL_RESET_TOKEN_EXPIRE_HOURS=24
    )
    email_manager_mock._settings = settings_mock
    email_manager_mock._render_template.return_value = html_content
    login_router: LoginRouter = LoginRouter()
    result: HTMLResponse = await login_router.recover_password_html_content(
        email=email,
        _=current_superuser,  # type: ignore
        email_manager=email_manager_mock,
    )
    email_manager_mock.generate_password_reset_token.assert_called_once_with(email=email)
    email_manager_mock._render_template.assert_called_once_with(
        template_name="reset_password.html",
        context={
            "project_name": settings_mock.PROJECT_NAME,
            "username": email,
            "email": email,
            "valid_hours": settings_mock.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": f"{settings_mock.FRONTEND_HOST}/reset-password?token={token}",
        },
    )
    assert result.body.decode() == html_content  # type: ignore
    assert result.headers["subject"] == f"{settings_mock.PROJECT_NAME} - Password recovery for user {email}"
