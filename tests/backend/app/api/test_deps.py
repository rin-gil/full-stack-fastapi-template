"""Unit tests for backend/src/app/api/deps.py"""

from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from jwt.exceptions import InvalidTokenError
from pytest_mock import MockerFixture
from sqlmodel.ext.asyncio.session import AsyncSession

# noinspection PyProtectedMember
from app.api.deps import ActiveSuperuserProvider, CurrentUserProvider, ItemCRUDProvider, UserCRUDProvider
from app.core.config import Settings
from app.core.security import SecurityManager
from app.crud.item import ItemCRUD
from app.crud.user import UserCRUD
from app.models import User

__all__: tuple = ()


@pytest.mark.asyncio
async def test_user_crud_provider() -> None:
    """
    Test the UserCRUDProvider class.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    user_crud_provider: UserCRUDProvider = UserCRUDProvider(session=session_mock)
    result: UserCRUD = user_crud_provider()
    assert isinstance(result, UserCRUD)
    assert result._session is session_mock


@pytest.mark.asyncio
async def test_item_crud_provider() -> None:
    """
    Test the ItemCRUDProvider class.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    item_crud_provider: ItemCRUDProvider = ItemCRUDProvider(session=session_mock)
    result: ItemCRUD = item_crud_provider()
    assert isinstance(result, ItemCRUD)
    assert result._session is session_mock


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token_payload, user, raises_exception, expected_status, expected_detail",
    [
        ({"sub": str(uuid4())}, MagicMock(spec=User, is_active=True), False, None, None),
        ({"sub": str(uuid4())}, None, True, 404, "User not found"),
        ({"sub": str(uuid4())}, MagicMock(spec=User, is_active=False), True, 400, "Inactive user"),
        ({"sub": None}, None, True, 403, "Could not validate credentials"),
        ({}, None, True, 403, "Could not validate credentials"),
    ],
    ids=["success", "user_not_found", "inactive_user", "missing_sub", "invalid_token"],
)
async def test_current_user_provider(
    mocker: MockerFixture,
    token_payload: dict,
    user: User | None,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the CurrentUserProvider class for various scenarios.

    :param mocker: Pytest mocker fixture.
    :param token_payload: Mocked JWT token payload.
    :param user: Mocked User object or None.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCRUD)
    user_crud_mock.get_by_id.return_value = user
    token: str = "mocked_token"
    settings_mock: MagicMock = MagicMock(spec=Settings)
    settings_mock.SECRET_KEY = "secret"
    settings_mock.API_V1_STR = "/api/v1"
    mocker.patch(target="app.api.deps.get_settings", return_value=settings_mock)
    security_mock: MagicMock = MagicMock(spec=SecurityManager)
    security_mock.ALGORITHM = "HS256"
    mocker.patch(target="app.api.deps.get_security_manager", return_value=security_mock)
    if token_payload == {}:
        mocker.patch(target="jwt.decode", side_effect=InvalidTokenError("Invalid token"))
    else:
        mocker.patch(target="jwt.decode", return_value=token_payload)
    current_user_provider: CurrentUserProvider = CurrentUserProvider(user_crud=user_crud_mock, token=token)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await current_user_provider()
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
        if token_payload.get("sub") and token_payload["sub"] is not None:
            user_crud_mock.get_by_id.assert_called_once_with(user_id=UUID(token_payload["sub"]))
        else:
            user_crud_mock.get_by_id.assert_not_called()
    else:
        result: User = await current_user_provider()
        user_crud_mock.get_by_id.assert_called_once_with(user_id=UUID(token_payload["sub"]))
        assert result is user


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_superuser, raises_exception, expected_status, expected_detail",
    [(True, False, None, None), (False, True, 403, "The user doesn't have enough privileges")],
    ids=["superuser", "not_superuser"],
)
async def test_active_superuser_provider(
    is_superuser: bool, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the ActiveSuperuserProvider class for superuser and non-superuser scenarios.

    :param is_superuser: Whether the user is a superuser.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_mock: MagicMock = MagicMock(spec=User, is_superuser=is_superuser)
    active_superuser_provider: ActiveSuperuserProvider = ActiveSuperuserProvider(current_user=user_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            active_superuser_provider()
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = active_superuser_provider()
        assert result is user_mock
