"""Unit tests for backend/src/app/api/routes/items.py"""

from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import OptionalCurrentUser

# noinspection PyProtectedMember
from app.api.routes.items import ItemsRouter
from app.crud.item import ItemCRUD
from app.models import Item, ItemCreate, ItemPublic, ItemUpdate, ItemsPublic, Message, User

__all__: tuple = ()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user,is_superuser,expected_items,expected_count",
    [
        (None, False, [], 0),
        (
            MagicMock(spec=User, is_superuser=False, id=uuid4()),
            False,
            [ItemPublic(title="Test Item", description=None, id=uuid4(), owner_id=uuid4())],
            1,
        ),
        (
            MagicMock(spec=User, is_superuser=True, id=uuid4()),
            True,
            [ItemPublic(title="Test Item", description=None, id=uuid4(), owner_id=uuid4())],
            1,
        ),
    ],
    ids=["anonymous", "regular_user", "superuser"],
)
async def test_read_items(
    user: OptionalCurrentUser, is_superuser: bool, expected_items: list[ItemPublic], expected_count: int
) -> None:
    """
    Test the read_items endpoint for various user scenarios.

    :param user: Mocked user or None for anonymous.
    :param is_superuser: Whether the user is a superuser.
    :param expected_items: Expected list of items.
    :param expected_count: Expected count of items.
    :return: None
    """
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCRUD)
    if user and is_superuser:
        item_crud_mock.get_multi.return_value = ItemsPublic(data=expected_items, count=expected_count)
    elif user:
        item_crud_mock.get_multi_by_owner.return_value = ItemsPublic(data=expected_items, count=expected_count)
    else:
        item_crud_mock.get_multi.assert_not_called()
        item_crud_mock.get_multi_by_owner.assert_not_called()
    items_router: ItemsRouter = ItemsRouter(item_crud=item_crud_mock, current_user=user)
    result: ItemsPublic = await items_router.read_items(skip=0, limit=100)
    if user and is_superuser:
        item_crud_mock.get_multi.assert_called_once_with(skip=0, limit=100)
        item_crud_mock.get_multi_by_owner.assert_not_called()
    elif user:
        item_crud_mock.get_multi_by_owner.assert_called_once_with(owner_id=user.id, skip=0, limit=100)
        item_crud_mock.get_multi.assert_not_called()
    else:
        item_crud_mock.get_multi.assert_not_called()
        item_crud_mock.get_multi_by_owner.assert_not_called()
    assert result.data == expected_items
    assert result.count == expected_count


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user,raises_exception,expected_status,expected_detail",
    [(MagicMock(spec=User, id=uuid4()), False, None, None), (None, True, 401, "Not authenticated")],
    ids=["authenticated", "anonymous"],
)
async def test_create_item(
    user: OptionalCurrentUser, raises_exception: bool, expected_status: int | None, expected_detail: str | None
) -> None:
    """
    Test the create_item endpoint for various user scenarios.

    :param user: Mocked user or None for anonymous.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCRUD)
    item_create: ItemCreate = MagicMock(spec=ItemCreate)
    item_mock: ItemPublic = ItemPublic(
        title="Test Item", description=None, id=uuid4(), owner_id=user.id if user else uuid4()
    )
    item_crud_mock.create_with_owner.return_value = item_mock
    items_router: ItemsRouter = ItemsRouter(item_crud=item_crud_mock, current_user=user)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await items_router.create_item(item_in=item_create)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Item = await items_router.create_item(item_in=item_create)
        item_crud_mock.create_with_owner.assert_called_once_with(item_in=item_create, owner_id=user.id)
        assert result == item_mock


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user,is_superuser,item_exists,owner_id,raises_exception,expected_status,expected_detail",
    [
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, True, uuid4(), False, None, None),
        (MagicMock(spec=User, is_superuser=False, id=uuid4()), False, True, uuid4(), False, None, None),
        (None, False, True, uuid4(), True, 401, "Not authenticated"),
        (
            MagicMock(spec=User, is_superuser=False, id=uuid4()),
            False,
            True,
            uuid4(),
            True,
            403,
            "Not enough permissions",
        ),
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, False, uuid4(), True, 404, "Item not found"),
    ],
    ids=["superuser", "owner", "anonymous", "not_owner", "item_not_found"],
)
async def test_read_item(
    user: OptionalCurrentUser,
    is_superuser: bool,
    item_exists: bool,
    owner_id: UUID | None,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the read_item endpoint for various scenarios.

    :param user: Mocked user or None for anonymous.
    :param is_superuser: Whether the user is a superuser.
    :param item_exists: Whether the item exists in the database.
    :param owner_id: The ID of the item owner.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCRUD)
    item_id: UUID = uuid4()
    user_id: UUID = user.id if user else uuid4()
    item_mock: ItemPublic = ItemPublic(
        title="Test Item",
        description=None,
        id=item_id,
        owner_id=user_id if not raises_exception and not is_superuser else owner_id,
    )
    item_crud_mock.get.return_value = item_mock if item_exists else None
    items_router: ItemsRouter = ItemsRouter(item_crud=item_crud_mock, current_user=user)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await items_router.read_item(item_id=item_id)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Item = await items_router.read_item(item_id=item_id)
        item_crud_mock.get.assert_called_once_with(item_id=item_id)
        assert result == item_mock


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user,is_superuser,item_exists,owner_id,raises_exception,expected_status,expected_detail",
    [
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, True, uuid4(), False, None, None),
        (MagicMock(spec=User, is_superuser=False, id=uuid4()), False, True, uuid4(), False, None, None),
        (None, False, True, uuid4(), True, 401, "Not authenticated"),
        (
            MagicMock(spec=User, is_superuser=False, id=uuid4()),
            False,
            True,
            uuid4(),
            True,
            403,
            "Not enough permissions",
        ),
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, False, uuid4(), True, 404, "Item not found"),
    ],
    ids=["superuser", "owner", "anonymous", "not_owner", "item_not_found"],
)
async def test_update_item(
    user: OptionalCurrentUser,
    is_superuser: bool,
    item_exists: bool,
    owner_id: UUID | None,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the update_item endpoint for various scenarios.

    :param user: Mocked user or None for anonymous.
    :param is_superuser: Whether the user is a superuser.
    :param item_exists: Whether the item exists in the database.
    :param owner_id: The ID of the item owner.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCRUD)
    item_id: UUID = uuid4()
    user_id: UUID = user.id if user else uuid4()
    item_update: ItemUpdate = MagicMock(spec=ItemUpdate)
    item_mock: ItemPublic = ItemPublic(
        title="Test Item",
        description=None,
        id=item_id,
        owner_id=user_id if not raises_exception and not is_superuser else owner_id,
    )
    item_crud_mock.get.return_value = item_mock if item_exists else None
    item_crud_mock.update.return_value = item_mock
    items_router: ItemsRouter = ItemsRouter(item_crud=item_crud_mock, current_user=user)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await items_router.update_item(item_id=item_id, item_in=item_update)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Item = await items_router.update_item(item_id=item_id, item_in=item_update)
        item_crud_mock.get.assert_called_once_with(item_id=item_id)
        item_crud_mock.update.assert_called_once_with(db_item=item_mock, item_in=item_update)
        assert result == item_mock


# noinspection PyPropertyAccess,PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user,is_superuser,item_exists,owner_id,raises_exception,expected_status,expected_detail",
    [
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, True, uuid4(), False, None, None),
        (MagicMock(spec=User, is_superuser=False, id=uuid4()), False, True, uuid4(), False, None, None),
        (None, False, True, uuid4(), True, 401, "Not authenticated"),
        (
            MagicMock(spec=User, is_superuser=False, id=uuid4()),
            False,
            True,
            uuid4(),
            True,
            403,
            "Not enough permissions",
        ),
        (MagicMock(spec=User, is_superuser=True, id=uuid4()), True, False, uuid4(), True, 404, "Item not found"),
    ],
    ids=["superuser", "owner", "anonymous", "not_owner", "item_not_found"],
)
async def test_delete_item(
    user: OptionalCurrentUser,
    is_superuser: bool,
    item_exists: bool,
    owner_id: UUID | None,
    raises_exception: bool,
    expected_status: int | None,
    expected_detail: str | None,
) -> None:
    """
    Test the delete_item endpoint for various scenarios.

    :param user: Mocked user or None for anonymous.
    :param is_superuser: Whether the user is a superuser.
    :param item_exists: Whether the item exists in the database.
    :param owner_id: The ID of the item owner.
    :param raises_exception: Whether an exception is expected.
    :param expected_status: Expected HTTP status code if exception is raised.
    :param expected_detail: Expected exception detail if exception is raised.
    :return: None
    """
    item_crud_mock: AsyncMock = AsyncMock(spec=ItemCRUD)
    item_id: UUID = uuid4()
    user_id: UUID = user.id if user else uuid4()
    item_mock: ItemPublic = ItemPublic(
        title="Test Item",
        description=None,
        id=item_id,
        owner_id=user_id if not raises_exception and not is_superuser else owner_id,
    )
    item_crud_mock.get.return_value = item_mock if item_exists else None
    items_router: ItemsRouter = ItemsRouter(item_crud=item_crud_mock, current_user=user)
    if raises_exception:
        with pytest.raises(expected_exception=HTTPException) as exc_info:
            await items_router.delete_item(item_id=item_id)
        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
    else:
        result: Message = await items_router.delete_item(item_id=item_id)
        item_crud_mock.get.assert_called_once_with(item_id=item_id)
        item_crud_mock.remove.assert_called_once_with(item_id=item_id)
        assert result == Message(message="Item deleted successfully")
