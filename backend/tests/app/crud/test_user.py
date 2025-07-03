"""Unit tests for backend/src/app/crud/user.py"""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, ANY
from uuid import UUID, uuid4

import pytest
from pytest_mock import MockerFixture
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import SecurityManager
from app.crud.user import UserCRUD
from app.models import User, UserCreate, UserUpdate, UsersPublic

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
@pytest.mark.parametrize(
    "user_in, update_dict, security_called",
    [
        (UserUpdate(full_name="New Name", password="new_password"), {"hashed_password": "new_hashed_password"}, True),
        (UserUpdate(full_name="New Name Only"), {}, False),
    ],
    ids=["with_password", "without_password"],
)
async def test_user_crud_update(
    mocker: MockerFixture, user_in: UserUpdate, update_dict: dict[str, str], security_called: bool
) -> None:
    """
    Test the update method of UserCRUD for both password and non-password updates.

    :param mocker: Pytest mocker fixture.
    :param user_in: User update data.
    :param update_dict: Additional data for update (e.g., hashed password).
    :param security_called: Whether you get_password_hash should be called.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.get_password_hash.return_value = "new_hashed_password"
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    db_user_mock: MagicMock = MagicMock(spec=User)
    expected_user_data: dict[str, Any] = user_in.model_dump(exclude_unset=True)
    if "password" in expected_user_data:
        del expected_user_data["password"]
    result: User = await user_crud.update(db_user=db_user_mock, user_in=user_in)
    if security_called:
        security_mock.get_password_hash.assert_called_once_with(password="new_password")
    else:
        security_mock.get_password_hash.assert_not_called()
    db_user_mock.sqlmodel_update.assert_called_once_with(obj=expected_user_data, update=update_dict)
    session_mock.add.assert_called_once_with(instance=db_user_mock)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_user_mock)
    assert result is db_user_mock


@pytest.mark.asyncio
@pytest.mark.parametrize("user_in_db", [MagicMock(spec=User), None], ids=["user_found", "user_not_found"])
async def test_user_crud_get_by_id(user_in_db: User | None) -> None:
    """
    Test the get_by_id method of UserCRUD for both found and not found scenarios.

    :param user_in_db: User object to be returned by the 'session.get' method.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    session_mock.get.return_value = user_in_db
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    user_id: UUID = uuid4()
    result: User | None = await user_crud.get_by_id(user_id=user_id)
    session_mock.get.assert_called_once_with(entity=User, ident=user_id)
    assert result is user_in_db, f"Expected {user_in_db}, got {result}"


@pytest.mark.asyncio
@pytest.mark.parametrize("user_in_db", [MagicMock(spec=User), None], ids=["user_found", "user_not_found"])
async def test_user_crud_get_by_email(user_in_db: User | None) -> None:
    """
    Test the get_by_email method of UserCRUD for both found and not found scenarios.

    :param user_in_db: User object to be returned by the exec method.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    result_mock: MagicMock = MagicMock()
    result_mock.first.return_value = user_in_db
    session_mock.exec.return_value = result_mock
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    result: User | None = await user_crud.get_by_email(email="test@example.com")
    session_mock.exec.assert_called_once()
    assert result is user_in_db


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user_in_db, password_is_valid, expected_result",
    [
        (
            MagicMock(spec=User, hashed_password="correct_hash", email="test@example.com", full_name="Test User"),
            True,
            None,
        ),
        (None, False, None),
        (
            MagicMock(spec=User, hashed_password="incorrect_hash", email="test@example.com", full_name="Test User"),
            False,
            None,
        ),
    ],
    ids=["success", "user_not_found", "invalid_password"],
)
async def test_user_crud_authenticate(
    mocker: MockerFixture, user_in_db: User | None, password_is_valid: bool, expected_result: User | None
) -> None:
    """
    Test the authenticate method of UserCRUD for successful and failed authentication.

    :param mocker: Pytest mocker fixture.
    :param user_in_db: User object to be returned by the get_by_email method.
    :param password_is_valid: Password validation result.
    :param expected_result: Expected result of the authenticate method.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    security_mock: MagicMock = mocker.MagicMock(spec=SecurityManager)
    security_mock.verify_password.return_value = password_is_valid
    mocker.patch.object(target=UserCRUD, attribute="_security", new=security_mock)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    email: str = "test@example.com"
    password: str = "password123"
    user_crud.get_by_email = AsyncMock(return_value=user_in_db)  # type: ignore
    result: User | None = await user_crud.authenticate(email=email, password=password)
    user_crud.get_by_email.assert_called_once_with(email=email)
    if user_in_db:
        security_mock.verify_password.assert_called_once_with(
            plain_password=password, hashed_password=user_in_db.hashed_password
        )
    else:
        security_mock.verify_password.assert_not_called()
    expected_result = user_in_db if password_is_valid else None
    assert result is expected_result, f"Expected {expected_result}, got {result}"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "skip, limit, users_count, expected_users",
    [
        (0, 100, 2, [User(email="user1@example.com"), User(email="user2@example.com")]),
        (1, 1, 2, [User(email="user2@example.com")]),
        (0, 100, 0, []),
    ],
    ids=["default_pagination", "skip_and_limit", "empty_result"],
)
async def test_user_crud_get_multi(skip: int, limit: int, users_count: int, expected_users: list[User]) -> None:
    """
    Test the get_multi method of UserCRUD.

    :param skip: Number of users to skip.
    :param limit: Maximum number of users to return.
    :param users_count: Total number of users in the database.
    :param expected_users: Expected list of users to be returned.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    session_mock.exec.side_effect = [
        MagicMock(one=MagicMock(return_value=users_count)),
        MagicMock(all=MagicMock(return_value=expected_users)),
    ]
    result: UsersPublic = await user_crud.get_multi(skip=skip, limit=limit)
    assert session_mock.exec.call_count == 2
    session_mock.exec.assert_any_call(statement=ANY)
    session_mock.exec.assert_any_call(statement=ANY)
    assert result == UsersPublic(
        data=expected_users, count=users_count
    ), f"Expected UsersPublic(data={expected_users}, count={users_count}), got {result}"


@pytest.mark.asyncio
@pytest.mark.parametrize("user_in_db", [MagicMock(spec=User), None], ids=["user_found", "user_not_found"])
async def test_user_crud_remove(user_in_db: User | None) -> None:
    """
    Test the remove method of UserCRUD.

    :param user_in_db: User object to be returned by the get_by_id method.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    user_crud: UserCRUD = UserCRUD(session=session_mock)
    user_id: UUID = uuid4()
    user_crud.get_by_id = AsyncMock(return_value=user_in_db)  # type: ignore
    result: User | None = await user_crud.remove(user_id=user_id)
    user_crud.get_by_id.assert_called_once_with(user_id=user_id)
    if user_in_db:
        session_mock.delete.assert_called_once_with(instance=user_in_db)
        session_mock.commit.assert_called_once()
    else:
        session_mock.delete.assert_not_called()
        session_mock.commit.assert_not_called()
    assert result is user_in_db, f"Expected {user_in_db}, got {result}"
