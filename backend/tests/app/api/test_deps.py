"""Unit tests for backend/src/app/api/deps.py"""

# pylint: disable=protected-access

from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from jwt.exceptions import InvalidTokenError
from pytest_mock import MockerFixture
from sqlmodel.ext.asyncio.session import AsyncSession

# noinspection PyProtectedMember
from app.api.deps import (
    ActiveSuperuserProvider,
    CurrentUserProvider,
    OptionalCurrentUserProvider,
    ItemCRUDProvider,
    UserCRUDProvider,
)
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
    user_crud_provider: UserCRUDProvider = UserCRUDProvider()
    result: UserCRUD = user_crud_provider(session=session_mock)
    assert isinstance(result, UserCRUD)
    assert result._session is session_mock


@pytest.mark.asyncio
async def test_item_crud_provider() -> None:
    """
    Test the ItemCRUDProvider class.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    item_crud_provider: ItemCRUDProvider = ItemCRUDProvider()
    result: ItemCRUD = item_crud_provider(session=session_mock)
    assert isinstance(result, ItemCRUD)
    assert result._session is session_mock


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token_payload,user,raises_exception,expected_status,expected_detail",
    [
        ({"sub": str(uuid4())}, MagicMock(spec=User, is_active=True), False, None, None),
        ({"sub": str(uuid4())}, None, True, 404, "User not found"),
        ({"sub": str(uuid4())}, MagicMock(spec=User, is_active=False), True, 400, "Inactive user"),
        ({"sub": "invalid-uuid"}, None, True, 403, "Could not validate credentials"),
        ({}, None, True, 403, "Could not validate credentials"),
    ],
    ids=["success", "user_not_found", "inactive_user", "invalid_uuid", "invalid_token"],
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
    mocker.patch(target="app.api.deps.settings")
    security_mock: SecurityManager = MagicMock(spec=SecurityManager)
    security_mock.ALGORITHM = "HS256"
    current_user_provider: CurrentUserProvider = CurrentUserProvider()
    if token_payload == {}:
        mocker.patch(target="jwt.decode", side_effect=InvalidTokenError("Invalid token"))
    else:
        mocker.patch(target="jwt.decode", return_value=token_payload)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await current_user_provider(token=token, user_crud=user_crud_mock, security_manager=security_mock)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await current_user_provider(
            token=token, user_crud=user_crud_mock, security_manager=security_mock
        )
        user_crud_mock.get_by_id.assert_called_once_with(user_id=UUID(token_payload["sub"]))
        assert result is user


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token,user,expected_result",
    [
        (None, None, None),
        ("mocked_token", None, None),
        ("mocked_token", MagicMock(spec=User, is_active=False), None),
        pytest.param("mocked_token", MagicMock(spec=User, is_active=True), None, marks=pytest.mark.xfail),
    ],
    ids=["no_token", "invalid_token", "inactive_user", "active_user"],
)
async def test_optional_current_user_provider(
    mocker: MockerFixture, token: str | None, user: User | None, expected_result: User | None
) -> None:
    """
    Test the OptionalCurrentUserProvider class for various scenarios.

    :param mocker: Pytest mocker fixture.
    :param token: Mocked JWT token or None.
    :param user: Mocked User object or None.
    :param expected_result: Expected result (User or None).
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCRUD)
    user_crud_mock.get_by_id.return_value = user
    security_mock: SecurityManager = MagicMock(spec=SecurityManager)
    security_mock.ALGORITHM = "HS256"
    optional_current_user_provider: OptionalCurrentUserProvider = OptionalCurrentUserProvider()
    mocker.patch(target="app.api.deps.settings")
    user_id: UUID = uuid4()
    if token and user:
        mocker.patch(target="jwt.decode", return_value={"sub": str(user_id)})
    elif token:
        mocker.patch(target="jwt.decode", side_effect=InvalidTokenError("Invalid token"))
    result: User | None = await optional_current_user_provider(
        token=token, user_crud=user_crud_mock, security_manager=security_mock
    )
    if token and user:
        user_crud_mock.get_by_id.assert_called_once_with(user_id=user_id)
    else:
        user_crud_mock.get_by_id.assert_not_called()
    assert result == (user if user and user.is_active else None)


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_superuser,raises_exception,expected_status,expected_detail",
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
    active_superuser_provider: ActiveSuperuserProvider = ActiveSuperuserProvider()
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            active_superuser_provider(current_user=user_mock)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = active_superuser_provider(current_user=user_mock)
        assert result is user_mock
