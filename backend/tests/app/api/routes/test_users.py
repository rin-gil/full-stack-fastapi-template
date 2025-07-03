"""Unit tests for backend/src/app/api/routes/users.py"""

import asyncio
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from fastapi import BackgroundTasks, HTTPException

from app.api.deps import ItemCrudDep, UserCrudDep
# noinspection PyProtectedMember
from app.api.routes.users import UsersRouter
from app.core.config import Settings
from app.core.emails import EmailManager
from app.core.security import SecurityManager
from app.models import (
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UsersPublic,
)

__all__: tuple = ()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_superuser,expected_data,expected_count",
    [
        (
            True,
            [UserPublic(id=uuid4(), email="user@example.com", is_active=True, is_superuser=False, full_name=None)],
            1,
        ),
        (False, None, None),
    ],
    ids=["superuser", "non_superuser"],
)
async def test_read_users(
    is_superuser: bool, expected_data: list[UserPublic] | None, expected_count: int | None
) -> None:
    """
    Test the read_users endpoint for various user scenarios.

    :param is_superuser: Whether the user is a superuser.
    :param expected_data: Expected list of users.
    :param expected_count: Expected count of users.
    :return: None
    """
    if not is_superuser:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "The user doesn't have enough privileges"
        return None
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    future: asyncio.Future = asyncio.Future()
    future.set_result(UsersPublic(data=expected_data, count=expected_count))
    user_crud_mock.get_multi.return_value = future
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    superuser_mock: User = MagicMock(spec=User, is_superuser=True)
    result: UsersPublic = await users_router.read_users(_=superuser_mock, skip=0, limit=100)
    user_crud_mock.get_multi.assert_called_once_with(skip=0, limit=100)
    assert result.data == expected_data
    assert result.count == expected_count


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_superuser,existing_user,emails_enabled,raises_exception,expected_status,expected_detail",
    [
        (True, None, True, False, None, None),
        (
            True,
            MagicMock(spec=User, id=uuid4(), email="user@example.com"),
            True,
            True,
            400,
            "The user with this email already exists in the system.",
        ),
        (False, None, True, True, 403, "The user doesn't have enough privileges"),
        (True, None, False, False, None, None),
    ],
    ids=["superuser_success", "superuser_duplicate_email", "non_superuser", "superuser_no_email"],
)
async def test_create_user(
    is_superuser: bool,
    existing_user: User | None,
    emails_enabled: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the create_user endpoint for various user scenarios.

    :param is_superuser: Whether the user is a superuser.
    :param existing_user: Mocked existing user or None.
    :param emails_enabled: Whether email sending is enabled.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    if not is_superuser:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            raise HTTPException(status_code=expected_status, detail=expected_detail)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
        return None
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    superuser_mock: User = MagicMock(spec=User, is_superuser=is_superuser)
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(existing_user)
    user_crud_mock.get_by_email.return_value = future_get
    user_create: UserCreate = UserCreate(email="newuser@example.com", password="password123")
    new_user: User = User(id=uuid4(), email=user_create.email, is_active=True, is_superuser=False, full_name=None)
    future_create: asyncio.Future = asyncio.Future()
    future_create.set_result(new_user)
    user_crud_mock.create.return_value = future_create
    email_manager_mock: AsyncMock = AsyncMock(spec=EmailManager)
    background_tasks_mock: MagicMock = MagicMock(spec=BackgroundTasks)
    settings_mock: MagicMock = MagicMock(spec=Settings, emails_enabled=emails_enabled)
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.create_user(
                user_in=user_create,
                email_manager=email_manager_mock,
                background_tasks=background_tasks_mock,
                settings=settings_mock,
                _=superuser_mock,
            )
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await users_router.create_user(
            user_in=user_create,
            email_manager=email_manager_mock,
            background_tasks=background_tasks_mock,
            settings=settings_mock,
            _=superuser_mock,
        )
        user_crud_mock.get_by_email.assert_called_once_with(email=user_create.email)
        user_crud_mock.create.assert_called_once_with(user_create=user_create)
        if emails_enabled:
            background_tasks_mock.add_task.assert_called_once_with(
                email_manager_mock.send_new_account_email,
                email_to=user_create.email,
                username=user_create.email,
                password=user_create.password,
            )
        else:
            background_tasks_mock.add_task.assert_not_called()
        assert result == new_user


@pytest.mark.asyncio
async def test_read_user_me() -> None:
    """
    Test the read_user_me endpoint.

    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    current_user: UserPublic = UserPublic(
        id=uuid4(), email="user@example.com", is_active=True, is_superuser=False, full_name=None
    )
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    result: User = await users_router.read_user_me(current_user=current_user)  # type: ignore
    assert result == current_user
    user_crud_mock.get_by_email.assert_not_called()
    user_crud_mock.get_multi.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "existing_user,raises_exception,expected_status,expected_detail",
    [
        (None, False, None, None),
        (MagicMock(spec=User, id=uuid4(), email="other@example.com"), True, 409, "User with this email already exists"),
    ],
    ids=["success", "email_conflict"],
)
async def test_update_user_me(
    existing_user: User | None, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the update_user_me endpoint for various scenarios.

    :param existing_user: Mocked existing user or None.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    current_user: UserPublic = UserPublic(
        id=uuid4(), email="user@example.com", is_active=True, is_superuser=False, full_name=None
    )
    user_in: UserUpdateMe = UserUpdateMe(email="newemail@example.com", full_name="New Name")
    updated_user: UserPublic = UserPublic(
        id=current_user.id, email=user_in.email, is_active=True, is_superuser=False, full_name=user_in.full_name
    )
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(existing_user)
    user_crud_mock.get_by_email.return_value = future_get
    future_update: asyncio.Future = asyncio.Future()
    future_update.set_result(updated_user)
    user_crud_mock.update.return_value = future_update
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.update_user_me(user_in=user_in, current_user=current_user)  # type: ignore
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await users_router.update_user_me(user_in=user_in, current_user=current_user)  # type: ignore
        if user_in.email:
            user_crud_mock.get_by_email.assert_called_once_with(email=user_in.email)
        user_crud_mock.update.assert_called_once_with(db_user=current_user, user_in=user_in)
        assert result == updated_user


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "password_verified,same_password,raises_exception,expected_status,expected_detail",
    [
        (True, False, False, None, None),
        (False, False, True, 400, "Incorrect password"),
        (True, True, True, 400, "New password cannot be the same as the current one"),
    ],
    ids=["success", "incorrect_password", "same_password"],
)
async def test_update_password_me(
    password_verified: bool,
    same_password: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the update_password_me endpoint for various scenarios.

    :param password_verified: Whether the current password is verified.
    :param same_password: Whether the new password is the same as the current one.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    security_manager_mock: AsyncMock = AsyncMock(spec=SecurityManager)
    current_user: User = MagicMock(
        spec=User,
        id=uuid4(),
        email="user@example.com",
        is_active=True,
        is_superuser=False,
        full_name=None,
        hashed_password="hashed",
    )
    body: UpdatePassword = UpdatePassword(
        current_password="old_password", new_password="new_password" if not same_password else "old_password"
    )
    security_manager_mock.verify_password.return_value = password_verified
    future_update: asyncio.Future = asyncio.Future()
    future_update.set_result(current_user)
    user_crud_mock.update.return_value = future_update
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.update_password_me(
                body=body, current_user=current_user, security_manager=security_manager_mock
            )
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Message = await users_router.update_password_me(
            body=body, current_user=current_user, security_manager=security_manager_mock
        )
        security_manager_mock.verify_password.assert_called_once_with(
            plain_password=body.current_password, hashed_password=current_user.hashed_password
        )
        user_crud_mock.update.assert_called_once_with(
            db_user=current_user, user_in=UserUpdate(password=body.new_password)
        )
        assert result == Message(message="Password updated successfully")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_superuser,raises_exception,expected_status,expected_detail",
    [(False, False, None, None), (True, True, 403, "Super users are not allowed to delete themselves")],
    ids=["regular_user", "superuser"],
)
async def test_delete_user_me(
    is_superuser: bool, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the delete_user_me endpoint for various scenarios.

    :param is_superuser: Whether the user is a superuser.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    current_user: UserPublic = UserPublic(
        id=uuid4(), email="user@example.com", is_active=True, is_superuser=is_superuser, full_name=None
    )
    future_remove: asyncio.Future = asyncio.Future()
    future_remove.set_result(None)
    user_crud_mock.remove.return_value = future_remove
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.delete_user_me(current_user=current_user)  # type: ignore
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Message = await users_router.delete_user_me(current_user=current_user)  # type: ignore
        user_crud_mock.remove.assert_called_once_with(user_id=current_user.id)
        assert result == Message(message="User deleted successfully")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "existing_user,raises_exception,expected_status,expected_detail",
    [
        (None, False, None, None),
        (
            MagicMock(spec=User, id=uuid4(), email="user@example.com"),
            True,
            400,
            "The user with this email already exists in the system",
        ),
    ],
    ids=["success", "duplicate_email"],
)
async def test_register_user(
    existing_user: User | None, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the register_user endpoint for various scenarios.

    :param existing_user: Mocked existing user or None.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    user_in: UserRegister = UserRegister(email="newuser@example.com", password="password123", full_name="New User")
    user_create: UserCreate = UserCreate.model_validate(obj=user_in)
    new_user: UserPublic = UserPublic(
        id=uuid4(), email=user_in.email, is_active=True, is_superuser=False, full_name=user_in.full_name
    )
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(existing_user)
    user_crud_mock.get_by_email.return_value = future_get
    future_create: asyncio.Future = asyncio.Future()
    future_create.set_result(new_user)
    user_crud_mock.create.return_value = future_create
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.register_user(user_in=user_in)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await users_router.register_user(user_in=user_in)
        user_crud_mock.get_by_email.assert_called_once_with(email=user_in.email)
        user_crud_mock.create.assert_called_once_with(user_create=user_create)
        assert result == new_user


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "current_user_id,requested_user_id,is_superuser,exists,raises_exception,expected_status,expected_detail",
    [
        (uuid4(), uuid4(), True, True, False, None, None),
        (user_id := uuid4(), user_id, False, True, False, None, None),  # pylint: disable=undefined-variable,unused-variable
        (uuid4(), uuid4(), False, True, True, 403, "The user doesn't have enough privileges"),
        (uuid4(), uuid4(), True, False, True, 404, "User not found"),
    ],
    ids=["superuser", "same_user", "non_superuser_different_user", "user_not_found"],
)
async def test_read_user_by_id(
    current_user_id: UUID,
    requested_user_id: UUID,
    is_superuser: bool,
    exists: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the read_user_by_id endpoint for various scenarios.

    :param current_user_id: ID of the current user.
    :param requested_user_id: ID of the user to retrieve.
    :param is_superuser: Whether the current user is a superuser.
    :param exists: Whether the requested user exists.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    current_user: UserPublic = UserPublic(
        id=current_user_id, email="user@example.com", is_active=True, is_superuser=is_superuser, full_name=None
    )
    requested_user: UserPublic = UserPublic(
        id=requested_user_id, email="other@example.com", is_active=True, is_superuser=False, full_name=None
    )
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(requested_user if exists else None)
    user_crud_mock.get_by_id.return_value = future_get
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.read_user_by_id(user_id=requested_user_id, current_user=current_user)  # type: ignore
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await users_router.read_user_by_id(
            user_id=requested_user_id,
            current_user=current_user,  # type: ignore
        )
        user_crud_mock.get_by_id.assert_called_once_with(user_id=requested_user_id)
        assert result == requested_user


# noinspection PyUnresolvedReferences,PyShadowingNames
# pylint: disable=redefined-outer-name
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "existing_user,exists,raises_exception,expected_status,expected_detail",
    [
        (None, True, False, None, None),
        (
            MagicMock(spec=User, id=uuid4(), email="other@example.com"),
            True,
            True,
            409,
            "User with this email already exists",
        ),
        (None, False, True, 404, "The user with this id does not exist in the system"),
    ],
    ids=["success", "email_conflict", "user_not_found"],
)
async def test_update_user(
    existing_user: User | None,
    exists: bool,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the update_user endpoint for various scenarios.

    :param existing_user: Mocked existing user or None.
    :param exists: Whether the user to update exists.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    user_id: UUID = uuid4()
    user_in: UserUpdate = UserUpdate(email="newemail@example.com", full_name="New Name")
    db_user: UserPublic = UserPublic(
        id=user_id, email="user@example.com", is_active=True, is_superuser=False, full_name=None
    )
    updated_user: UserPublic = UserPublic(
        id=user_id, email=user_in.email, is_active=True, is_superuser=False, full_name=user_in.full_name
    )
    future_get_id: asyncio.Future = asyncio.Future()
    future_get_id.set_result(db_user if exists else None)
    user_crud_mock.get_by_id.return_value = future_get_id
    future_get_email: asyncio.Future = asyncio.Future()
    future_get_email.set_result(existing_user)
    user_crud_mock.get_by_email.return_value = future_get_email
    future_update: asyncio.Future = asyncio.Future()
    future_update.set_result(updated_user)
    user_crud_mock.update.return_value = future_update
    current_superuser: UserPublic = UserPublic(
        id=uuid4(), email="superuser@example.com", is_active=True, is_superuser=True, full_name=None
    )
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.update_user(user_id=user_id, user_in=user_in, _=current_superuser)  # type: ignore
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: User = await users_router.update_user(
            user_id=user_id,
            user_in=user_in,
            _=current_superuser,  # type: ignore
        )
        user_crud_mock.get_by_id.assert_called_once_with(user_id=user_id)
        if user_in.email:
            user_crud_mock.get_by_email.assert_called_once_with(email=user_in.email)
        user_crud_mock.update.assert_called_once_with(db_user=db_user, user_in=user_in)
        assert result == updated_user


# noinspection PyUnresolvedReferences,PyShadowingNames
# pylint: disable=redefined-outer-name
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "is_same_user,exists,raises_exception,expected_status,expected_detail",
    [
        (False, True, False, None, None),
        (True, True, True, 403, "Super users are not allowed to delete themselves"),
        (False, False, True, 404, "User not found"),
    ],
    ids=["success", "self_delete", "user_not_found"],
)
async def test_delete_user(
    is_same_user: bool, exists: bool, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the delete_user endpoint for various scenarios.

    :param is_same_user: Whether the superuser is trying to delete themselves.
    :param exists: Whether the user to delete exists.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    user_crud_mock: AsyncMock = AsyncMock(spec=UserCrudDep)
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCrudDep)
    user_id: UUID = uuid4()
    current_user_id: UUID = user_id if is_same_user else uuid4()
    user_to_delete: UserPublic = UserPublic(
        id=user_id, email="user@example.com", is_active=True, is_superuser=False, full_name=None
    )
    current_superuser: UserPublic = UserPublic(
        id=current_user_id, email="superuser@example.com", is_active=True, is_superuser=True, full_name=None
    )
    future_get: asyncio.Future = asyncio.Future()
    future_get.set_result(user_to_delete if exists else None)
    user_crud_mock.get_by_id.return_value = future_get
    future_remove: asyncio.Future = asyncio.Future()
    future_remove.set_result(None)
    user_crud_mock.remove.return_value = future_remove
    future_remove_items: asyncio.Future = asyncio.Future()
    future_remove_items.set_result(None)
    item_crud_mock.remove_by_owner.return_value = future_remove_items
    users_router: UsersRouter = UsersRouter(user_crud=user_crud_mock)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await users_router.delete_user(
                user_id=user_id, item_crud=item_crud_mock, current_superuser=current_superuser  # type: ignore
            )
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Message = await users_router.delete_user(
            user_id=user_id, item_crud=item_crud_mock, current_superuser=current_superuser  # type: ignore
        )
        user_crud_mock.get_by_id.assert_called_once_with(user_id=user_id)
        item_crud_mock.remove_by_owner.assert_called_once_with(owner_id=user_id)
        user_crud_mock.remove.assert_called_once_with(user_id=user_id)
        assert result == Message(message="User deleted successfully")
