"""Module for User CRUD operations for Item model."""

from uuid import UUID

from app.crud.base import BaseCRUD
from app.models import Item, ItemCreate

__all__: tuple[str] = ("ItemCRUD",)


class ItemCRUD(BaseCRUD):
    """CRUD operations for Item model."""

    async def create(self, item_in: ItemCreate, owner_id: UUID) -> Item:
        """
        Create a new item in the database.

        :param item_in: Item creation data
        :param owner_id: UUID of the item's owner
        :return: Created Item object
        """
        db_item: Item = Item.model_validate(obj=item_in, update={"owner_id": owner_id})
        self._session.add(db_item)
        await self._session.commit()
        await self._session.refresh(db_item)
        return db_item
