"""Module for User CRUD operations for Item model."""

from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import delete, Row, RowMapping, Delete
from sqlmodel import func, select

# noinspection PyProtectedMember
from sqlmodel.sql._expression_select_cls import SelectOfScalar

from app.crud.base import BaseCRUD
from app.models import Item, ItemCreate, ItemUpdate, ItemsPublic

__all__: tuple[str] = ("ItemCRUD",)


class ItemCRUD(BaseCRUD):
    """CRUD operations for Item model."""

    async def create_with_owner(self, *, item_in: ItemCreate, owner_id: UUID) -> Item:
        """
        Creates a new item and assigns it to an owner.

        :param item_in: Data required to create a new item.
        :param owner_id: UUID of the user who will own the item.
        :return: The created Item object with the owner assigned.
        """
        db_item: Item = Item.model_validate(obj=item_in, update={"owner_id": owner_id})
        self._session.add(instance=db_item)
        await self._session.commit()
        await self._session.refresh(instance=db_item)
        return db_item

    async def get(self, *, item_id: UUID) -> Item | None:
        """
        Retrieve an item by their ID.

        :param item_id: The UUID of the item.
        :return: Item object or None if not found.
        """
        return await self._session.get(entity=Item, ident=item_id)

    async def get_multi(self, *, skip: int = 0, limit: int = 100) -> ItemsPublic:
        """
        Retrieve multiple items from the database (for superusers).

        :param skip: The number of items to skip from the start of the query.
        :param limit: The maximum number of items to return.
        :return: An ItemsPublic object containing a list of items and the total count of items.
        """
        count_statement: SelectOfScalar = (  # type: ignore[arg-type]
            select(func.count()).select_from(Item)  # pylint: disable=not-callable
        )
        count: int = (await self._session.exec(statement=count_statement)).one()
        statement: SelectOfScalar = select(Item).offset(skip).limit(limit)
        items: Sequence[Row | RowMapping] = (await self._session.exec(statement=statement)).all()
        return ItemsPublic(data=items, count=count)

    async def get_multi_by_owner(self, *, owner_id: UUID, skip: int = 0, limit: int = 100) -> ItemsPublic:
        """
        Retrieve multiple items from the database (for regular users).

        :param owner_id: The UUID of the user who owns the items.
        :param skip: The number of items to skip from the start of the query.
        :param limit: The maximum number of items to return.
        :return: An ItemsPublic object containing a list of items and the total count of items.
        """
        count_statement: SelectOfScalar = (
            select(func.count())  # pylint: disable=not-callable
            .select_from(Item)
            .where(Item.owner_id == owner_id)  # type: ignore[arg-type]
        )
        count: int = (await self._session.exec(statement=count_statement)).one()
        statement: SelectOfScalar = (  # type: ignore
            select(Item).where(Item.owner_id == owner_id).offset(skip).limit(limit)
        )
        items: Sequence[Row | RowMapping] = (await self._session.exec(statement=statement)).all()
        return ItemsPublic(data=items, count=count)

    async def update(self, *, db_item: Item, item_in: ItemUpdate) -> Item:
        """
        Updates an existing item.

        :param db_item: Item object to update
        :param item_in: Item update data
        :return: Updated Item object.
        """
        update_dict: dict[str, Any] = item_in.model_dump(exclude_unset=True)
        db_item.sqlmodel_update(obj=update_dict)
        self._session.add(instance=db_item)
        await self._session.commit()
        await self._session.refresh(instance=db_item)
        return db_item

    async def remove(self, *, item_id: UUID) -> Item | None:
        """
        Deletes an item from the database.

        :param item_id: The UUID of the item to delete.
        :return: The deleted item, or None if no item was found.
        """
        db_item: Item | None = await self.get(item_id=item_id)
        if db_item:
            await self._session.delete(instance=db_item)
            await self._session.commit()
        return db_item

    async def remove_by_owner(self, *, owner_id: UUID) -> None:
        """
        Remove all items belonging to a specific owner.

        :param owner_id: UUID of the owner whose items will be deleted.
        :return: None
        """
        statement: Delete = delete(Item).where(Item.owner_id == owner_id)  # type: ignore[arg-type]
        await self._session.exec(statement=statement)  # type: ignore
        await self._session.commit()
