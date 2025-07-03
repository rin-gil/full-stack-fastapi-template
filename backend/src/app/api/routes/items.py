"""Module for items endpoints."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Path, status
from fastapi_utils.cbv import cbv

from app.api.deps import CurrentUser, ItemCrudDep, OptionalCurrentUser
from app.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate, Message

__all__: tuple[str] = ("items_router",)


ItemIdDep = Annotated[UUID, Path(alias="id", description="Item ID")]

items_router: APIRouter = APIRouter()


@cbv(router=items_router)
class ItemsRouter:
    """Class-based view for item endpoints."""

    def __init__(self, item_crud: ItemCrudDep, current_user: OptionalCurrentUser) -> None:
        """
        Initializes the ItemsRouter class with the necessary dependencies.

        :param item_crud: Dependency for item CRUD operations.
        :param current_user: Dependency for the current authorized user.
        """
        self._item_crud: ItemCrudDep = item_crud
        self._current_user: CurrentUser = current_user

    async def _get_and_validate_item(self, item_id: UUID) -> Item:
        """
        Private helper to retrieve an item by ID and validate user permissions.

        :param item_id: The ID of the item to retrieve.
        :return: The validated item object.
        :raises HTTPException: 404 if not found, 403 if no permission.
        """
        if not self._current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        db_item: Item = await self._item_crud.get(item_id=item_id)
        if not db_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
        if not self._current_user.is_superuser and (db_item.owner_id != self._current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return db_item

    @items_router.get(
        path="/",
        response_model=ItemsPublic,
        summary="Read Items",
        description="Getting the list of items. Anonymous users get an empty list.",
    )
    async def read_items(self, skip: int = 0, limit: int = 100) -> Any:
        """
        Endpoint for retrieving a list of items.

        :param skip: The number of items to skip.
        :param limit: The maximum number of items to return.
        :return: A list of items.
        """
        if not self._current_user:
            return ItemsPublic(data=[], count=0)
        if self._current_user.is_superuser:
            items: ItemsPublic = await self._item_crud.get_multi(skip=skip, limit=limit)
        else:
            items = await self._item_crud.get_multi_by_owner(
                owner_id=self._current_user.id, skip=skip, limit=limit
            )
        return items

    @items_router.post(
        path="/",
        response_model=ItemPublic,
        status_code=status.HTTP_201_CREATED,
        summary="Create Item",
        description="Creating a new Item.",
    )
    async def create_item(self, *, item_in: ItemCreate) -> Item:
        """
        Endpoint for creating a new item.

        :param item_in: The data for the item to be created.
        :return: The newly created item.
        :raises HTTPException: 401 if not authenticated.
        """
        if not self._current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        item: Item = await self._item_crud.create_with_owner(item_in=item_in, owner_id=self._current_user.id)
        return item

    @items_router.get(
        path="/{id}", response_model=ItemPublic, summary="Read Item by ID", description="Getting an item by ID."
    )
    async def read_item(self, item_id: ItemIdDep) -> Any:
        """
        Endpoint for retrieving an item by its ID.

        :param item_id: The ID of the item to retrieve.
        :return: The requested item.
        """
        return await self._get_and_validate_item(item_id=item_id)

    @items_router.put(path="/{id}", response_model=ItemPublic, summary="Update Item", description="Item update.")
    async def update_item(self, *, item_id: ItemIdDep, item_in: ItemUpdate) -> Item:
        """
        Endpoint for updating an existing item.

        :param item_id: The ID of the item to update.
        :param item_in: The new data for the item.
        :return: The updated item.
        """
        db_item: Item = await self._get_and_validate_item(item_id=item_id)
        return await self._item_crud.update(db_item=db_item, item_in=item_in)

    @items_router.delete(path="/{id}", response_model=Message, summary="Delete Item", description="Deleting an Item.")
    async def delete_item(self, item_id: ItemIdDep) -> Message:
        """
        Endpoint for deleting an item.

        :param item_id: The ID of the item to delete.
        :return: A message confirming the deletion.
        """
        await self._get_and_validate_item(item_id=item_id)
        await self._item_crud.remove(item_id=item_id)
        return Message(message="Item deleted successfully")
