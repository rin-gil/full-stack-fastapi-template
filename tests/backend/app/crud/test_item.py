"""Unit tests for backend/src/app/crud/item.py"""

from unittest.mock import ANY, AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.item import ItemCRUD
from app.models import Item, ItemCreate, ItemUpdate, ItemsPublic, ItemPublic

__all__: tuple = ()


@pytest.fixture
def session_mock() -> AsyncSession:
    """
    Fixture to provide a mocked AsyncSession.

    :return: Mocked AsyncSession object.
    """
    return AsyncMock(spec=AsyncSession)


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_item_crud_create_with_owner(session_mock: AsyncSession) -> None:
    """
    Test the create_with_owner method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    item_in: ItemCreate = ItemCreate(title="Test Item", description="Test Description")
    owner_id: UUID = uuid4()
    db_item: Item = Item(title="Test Item", description="Test Description", owner_id=owner_id)
    Item.model_validate = MagicMock(return_value=db_item)
    result: Item = await item_crud.create_with_owner(item_in=item_in, owner_id=owner_id)
    Item.model_validate.assert_called_once_with(obj=item_in, update={"owner_id": owner_id})
    session_mock.add.assert_called_once_with(instance=db_item)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_item)
    assert result == db_item, "Returned item should match the created item"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "item_title, item_description, owner_id",
    [("Item1", "Description1", uuid4()), ("Item2", None, uuid4()), ("Item3", "Description3", uuid4())],
    ids=["full_data", "no_description", "different_data"],
)
async def test_item_crud_create_with_different_inputs(
    session_mock: AsyncSession, item_title: str, item_description: str | None, owner_id: UUID
) -> None:
    """
    Test the create_with_owner method of ItemCRUD with different input parameters.

    :param session_mock: Mocked AsyncSession object.
    :param item_title: Title of the item to create.
    :param item_description: Description of the item to create (optional).
    :param owner_id: UUID of the item's owner.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    item_in: ItemCreate = ItemCreate(title=item_title, description=item_description)
    db_item: Item = Item(title=item_title, description=item_description, owner_id=owner_id)
    Item.model_validate = MagicMock(return_value=db_item)
    result: Item = await item_crud.create_with_owner(item_in=item_in, owner_id=owner_id)
    Item.model_validate.assert_called_once_with(obj=item_in, update={"owner_id": owner_id})
    session_mock.add.assert_called_once_with(instance=db_item)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_item)
    assert result == db_item, f"Returned item should match the created item with title {item_title}"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "item_exists, item_id", [(True, uuid4()), (False, uuid4())], ids=["item_exists", "item_not_found"]
)
async def test_item_crud_get(session_mock: AsyncSession, item_exists: bool, item_id: UUID) -> None:
    """
    Test the get method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param item_exists: Whether the item exists in the database.
    :param item_id: UUID of the item to retrieve.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    db_item: Item | None = (
        Item(title="Test Item", description="Test Description", owner_id=uuid4()) if item_exists else None
    )
    session_mock.get.return_value = db_item
    result: Item | None = await item_crud.get(item_id=item_id)
    session_mock.get.assert_called_once_with(entity=Item, ident=(item_id,))
    assert result == db_item, f"Expected {'item' if item_exists else 'None'}, got {result}"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "skip, limit, items_count, expected_items",
    [
        (
            0,
            100,
            2,
            [
                ItemPublic(title="Item1", owner_id=uuid4(), id=uuid4()),
                ItemPublic(title="Item2", owner_id=uuid4(), id=uuid4()),
            ],
        ),
        (
            1,
            1,
            2,
            [
                ItemPublic(title="Item2", owner_id=uuid4(), id=uuid4()),
            ],
        ),
        (0, 100, 0, []),
    ],
    ids=["default_pagination", "skip_and_limit", "empty_result"],
)
async def test_item_crud_get_multi(
    session_mock: AsyncSession, skip: int, limit: int, items_count: int, expected_items: list[ItemPublic]
) -> None:
    """
    Test the get_multi method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param skip: Number of items to skip.
    :param limit: Maximum number of items to return.
    :param items_count: Total number of items in the database.
    :param expected_items: Expected list of items to be returned.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    session_mock.exec.side_effect = [
        MagicMock(one=MagicMock(return_value=items_count)),
        MagicMock(all=MagicMock(return_value=[(item,) for item in expected_items])),
    ]
    result: ItemsPublic = await item_crud.get_multi(skip=skip, limit=limit)
    assert session_mock.exec.call_count == 2
    session_mock.exec.assert_any_call(statement=ANY)
    session_mock.exec.assert_any_call(statement=ANY)
    assert result.data == expected_items, f"Expected items {expected_items}, got {result.data}"
    assert result.count == items_count, f"Expected count {items_count}, got {result.count}"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "skip, limit, items_count, expected_items, owner_id",
    [
        (
            0,
            100,
            2,
            [
                ItemPublic(title="Item1", owner_id=uuid4(), id=uuid4()),
                ItemPublic(title="Item2", owner_id=uuid4(), id=uuid4()),
            ],
            uuid4(),
        ),
        (
            1,
            1,
            2,
            [
                ItemPublic(title="Item2", owner_id=uuid4(), id=uuid4()),
            ],
            uuid4(),
        ),
        (0, 100, 0, [], uuid4()),
    ],
    ids=["default_pagination", "skip_and_limit", "empty_result"],
)
async def test_item_crud_get_multi_by_owner(
    session_mock: AsyncSession,
    skip: int,
    limit: int,
    items_count: int,
    expected_items: list[ItemPublic],
    owner_id: UUID,
) -> None:
    """
    Test the get_multi_by_owner method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param skip: Number of items to skip.
    :param limit: Maximum number of items to return.
    :param items_count: Total number of items for the owner.
    :param expected_items: Expected list of items to be returned.
    :param owner_id: UUID of the item's owner.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    session_mock.exec.side_effect = [
        MagicMock(one=MagicMock(return_value=items_count)),
        MagicMock(all=MagicMock(return_value=[(item,) for item in expected_items])),
    ]
    result: ItemsPublic = await item_crud.get_multi_by_owner(owner_id=owner_id, skip=skip, limit=limit)
    assert session_mock.exec.call_count == 2
    session_mock.exec.assert_any_call(statement=ANY)
    session_mock.exec.assert_any_call(statement=ANY)
    assert result.data == expected_items, f"Expected items {expected_items}, got {result.data}"
    assert result.count == items_count, f"Expected count {items_count}, got {result.count}"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "update_data, expected_update",
    [
        (
            ItemUpdate(title="Updated Title", description="Updated Description"),
            {"title": "Updated Title", "description": "Updated Description"},
        ),
        (ItemUpdate(title="Updated Title"), {"title": "Updated Title"}),
        (ItemUpdate(description="Updated Description"), {"description": "Updated Description"}),
    ],
    ids=["full_update", "title_only", "description_only"],
)
async def test_item_crud_update(
    session_mock: AsyncSession, update_data: ItemUpdate, expected_update: dict[str, str]
) -> None:
    """
    Test the update method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param update_data: ItemUpdate object with data to update.
    :param expected_update: Expected dictionary of updated fields.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    db_item: Item = Item(title="Original Title", description="Original Description", owner_id=uuid4())
    result: Item = await item_crud.update(db_item=db_item, item_in=update_data)
    assert db_item.title == expected_update.get("title", db_item.title)
    assert db_item.description == expected_update.get("description", db_item.description)
    session_mock.add.assert_called_once_with(instance=db_item)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(instance=db_item)
    assert result == db_item, "Returned item should match the updated item"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "item_exists, item_id", [(True, uuid4()), (False, uuid4())], ids=["item_exists", "item_not_found"]
)
async def test_item_crud_remove(session_mock: AsyncSession, item_exists: bool, item_id: UUID) -> None:
    """
    Test the remove method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param item_exists: Whether the item exists in the database.
    :param item_id: UUID of the item to delete.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    db_item: Item | None = (
        Item(title="Test Item", description="Test Description", owner_id=uuid4()) if item_exists else None
    )
    session_mock.get.return_value = db_item
    result: Item | None = await item_crud.remove(item_id=item_id)
    session_mock.get.assert_called_once_with(entity=Item, ident=(item_id,))
    if item_exists:
        session_mock.delete.assert_called_once_with(instance=db_item)
        session_mock.commit.assert_called_once()
    else:
        session_mock.delete.assert_not_called()
        session_mock.commit.assert_not_called()
    assert result == db_item, f"Expected {'item' if item_exists else 'None'}, got {result}"


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
@pytest.mark.parametrize("items_exist, owner_id", [(True, uuid4()), (False, uuid4())], ids=["items_exist", "no_items"])
async def test_item_crud_remove_by_owner(session_mock: AsyncSession, items_exist: bool, owner_id: UUID) -> None:
    """
    Test the remove_by_owner method of ItemCRUD.

    :param session_mock: Mocked AsyncSession object.
    :param items_exist: Whether items exist for the owner.
    :param owner_id: UUID of the owner whose items will be deleted.
    :return: None
    """
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    session_mock.exec.return_value = MagicMock() if items_exist else MagicMock()
    await item_crud.remove_by_owner(owner_id=owner_id)
    session_mock.exec.assert_called_once_with(statement=ANY)
    session_mock.commit.assert_called_once()
