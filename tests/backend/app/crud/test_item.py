"""Unit tests for backend/src/app/crud/item.py"""

from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.item import ItemCRUD
from app.models import Item, ItemCreate

__all__: tuple = ()


@pytest.mark.asyncio
async def test_item_crud_create() -> None:
    """
    Test the create method of ItemCRUD.

    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    item_in: ItemCreate = ItemCreate(title="Test Item", description="Test Description")
    owner_id: UUID = uuid4()
    db_item: Item = Item(title="Test Item", description="Test Description", owner_id=owner_id)
    Item.model_validate = MagicMock(return_value=db_item)
    result: Item = await item_crud.create(item_in=item_in, owner_id=owner_id)
    Item.model_validate.assert_called_once_with(obj=item_in, update={"owner_id": owner_id})
    session_mock.add.assert_called_once_with(db_item)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(db_item)
    assert result == db_item, "Returned item should match the created item"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "item_title, item_description, owner_id",
    [("Item1", "Description1", uuid4()), ("Item2", None, uuid4()), ("Item3", "Description3", uuid4())],
    ids=["full_data", "no_description", "different_data"],
)
async def test_item_crud_create_with_different_inputs(
    item_title: str, item_description: str | None, owner_id: UUID
) -> None:
    """
    Test the create method of ItemCRUD with different input parameters.

    :param item_title: Title of the item to create.
    :param item_description: Description of the item to create (optional).
    :param owner_id: UUID of the item's owner.
    :return: None
    """
    session_mock: AsyncMock = AsyncMock(spec=AsyncSession)
    item_crud: ItemCRUD = ItemCRUD(session=session_mock)
    item_in: ItemCreate = ItemCreate(title=item_title, description=item_description)
    db_item: Item = Item(title=item_title, description=item_description, owner_id=owner_id)
    Item.model_validate = MagicMock(return_value=db_item)
    result: Item = await item_crud.create(item_in=item_in, owner_id=owner_id)
    Item.model_validate.assert_called_once_with(obj=item_in, update={"owner_id": owner_id})
    session_mock.add.assert_called_once_with(db_item)
    session_mock.commit.assert_called_once()
    session_mock.refresh.assert_called_once_with(db_item)
    assert result == db_item, f"Returned item should match the created item with title {item_title}"
