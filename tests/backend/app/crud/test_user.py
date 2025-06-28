"""Unit tests for backend/src/app/crud/user.py"""

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from pytest_mock import MockerFixture
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import SecurityManager
from app.crud.user import UserCRUD
from app.models import User, UserCreate, UserUpdate

__all__: tuple = ()


@pytest.mark.asyncio
async def test_user_crud_create(mocker: MockerFixture) -> None:
    """
    Test the create method of UserCRUD.

    :param mocker: Pytest mocker fixture.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.get_password_hash.return_value = "hashed_password_from_mock"
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    mock_user_instance: MagicMock = MagicMock(spec=User)
    mocker.patch(target="app.crud.user.User", return_value=mock_user_instance)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    user_in: UserCreate = UserCreate(email="test@example.com", password="password123", full_name="Test User")
    result: User = await user_crud.create(user_create=user_in)
    security_mock.get_password_hash.assert_called_once_with(password="password123")
    session_mock.add.assert_called_once_with(instance=mock_user_instance)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=mock_user_instance)
    assert result is mock_user_instance


@pytest.mark.asyncio
async def test_user_crud_update_with_password(mocker: MockerFixture) -> None:
    """
    Test the update method of UserCRUD with password update.

    :param mocker: Pytest mocker fixture.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.get_password_hash.return_value = "new_hashed_password"
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    db_user_mock: MagicMock = MagicMock(spec=User)
    user_in: UserUpdate = UserUpdate(full_name="New Name", password="new_password")
    user_data: dict[str, Any] = user_in.model_dump(exclude_unset=True)
    result: User = await user_crud.update(db_user=db_user_mock, user_in=user_in)
    security_mock.get_password_hash.assert_called_once_with(password="new_password")
    db_user_mock.sqlmodel_update.assert_called_once_with(
        obj=user_data, update={"hashed_password": "new_hashed_password"}
    )
    session_mock.add.assert_called_once_with(instance=db_user_mock)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_user_mock)
    assert result is db_user_mock


@pytest.mark.asyncio
async def test_user_crud_update_without_password(mocker: MockerFixture) -> None:
    """
    Test the update method of UserCRUD without password update.

    :param mocker: Pytest mocker fixture.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    db_user_mock: MagicMock = MagicMock(spec=User)
    user_in: UserUpdate = UserUpdate(full_name="New Name Only")
    user_data: dict[str, Any] = user_in.model_dump(exclude_unset=True)
    result: User = await user_crud.update(db_user=db_user_mock, user_in=user_in)
    security_mock.get_password_hash.assert_not_called()
    db_user_mock.sqlmodel_update.assert_called_once_with(obj=user_data, update={})
    session_mock.add.assert_called_once_with(instance=db_user_mock)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_user_mock)
    assert result is db_user_mock


@pytest.mark.asyncio
async def test_user_crud_get_by_email_found() -> None:
    """
    Test the get_by_email method of UserCRUD when a user is found.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    db_user_mock: MagicMock = MagicMock(spec=User)
    result_mock: MagicMock = MagicMock()
    result_mock.first.return_value = db_user_mock
    session_mock.exec.return_value = result_mock
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    result: User | None = await user_crud.get_by_email(email="test@example.com")
    session_mock.exec.assert_called_once()
    assert result is db_user_mock


@pytest.mark.asyncio
async def test_user_crud_get_by_email_not_found() -> None:
    """
    Test the get_by_email method of UserCRUD when a user is not found.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    result_mock: MagicMock = MagicMock()
    result_mock.first.return_value = None
    session_mock.exec.return_value = result_mock
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    result: User | None = await user_crud.get_by_email(email="notfound@example.com")
    session_mock.exec.assert_called_once()
    assert result is None


@pytest.mark.asyncio
async def test_user_crud_authenticate_success(mocker: MockerFixture) -> None:
    """
    Test the authenticate method of UserCRUD when authentication is successful.

    :param mocker: Pytest mocker fixture.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.verify_password.return_value = True
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    email: str = "test@example.com"
    password: str = "password123"
    db_user_mock: MagicMock = MagicMock(spec=User, hashed_password="correct_hash")
    user_crud.get_by_email = AsyncMock(return_value=db_user_mock)
    result: User | None = await user_crud.authenticate(email=email, password=password)
    user_crud.get_by_email.assert_called_once_with(email=email)
    security_mock.verify_password.assert_called_once_with(plain_password=password, hashed_password="correct_hash")
    assert result is db_user_mock


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user_in_db, password_is_valid",
    [(None, False), (MagicMock(spec=User, hashed_password="some_hash"), False)],
    ids=["user_not_found", "invalid_password"],
)
async def test_user_crud_authenticate_failure(mocker: MockerFixture, user_in_db, password_is_valid) -> None:
    """
    Test the authenticate method of UserCRUD when authentication fails.

    :param mocker: Pytest mocker fixture.
    :param user_in_db: User object to be returned by the get_by_email method.
    :param password_is_valid: Password validation result.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.verify_password.return_value = password_is_valid
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    email: str = "test@example.com"
    password: str = "any_password"
    user_crud.get_by_email = AsyncMock(return_value=user_in_db)
    result: User | None = await user_crud.authenticate(email=email, password=password)
    user_crud.get_by_email.assert_called_once_with(email=email)
    if user_in_db:
        security_mock.verify_password.assert_called_once()
    else:
        security_mock.verify_password.assert_not_called()
    assert result is None
