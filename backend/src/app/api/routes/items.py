# app/api/routes/items.py

import uuid
from typing import Any, Annotated

from fastapi import APIRouter, HTTPException, Path

# ИЗМЕНЕНИЕ: Импортируем наши новые, правильные зависимости
from app.api.deps import CurrentUser, ItemCRUDDep
from app.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate, Message

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
async def read_items(
        item_crud: ItemCRUDDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """
    Получение списка items.
    Суперпользователь видит все, обычный пользователь - только свои.
    """
    if current_user.is_superuser:
        items: ItemsPublic = await item_crud.get_multi(skip=skip, limit=limit)
    else:
        items = await item_crud.get_multi_by_owner(
            owner_id=current_user.id, skip=skip, limit=limit
        )
    return items


@router.post("/", response_model=ItemPublic)
async def create_item(
        *,
        item_crud: ItemCRUDDep,
        current_user: CurrentUser,
        item_in: ItemCreate,
) -> Any:
    """
    Создание нового item.
    """
    # Вся логика создания скрыта в одном методе
    item = await item_crud.create_with_owner(item_in=item_in, owner_id=current_user.id)
    return item


@router.get("/{id}", response_model=ItemPublic)
async def read_item(
        item_crud: ItemCRUDDep,
        current_user: CurrentUser,
        item_id: Annotated[uuid.UUID, Path(alias="id", description="ID элемента")],
) -> Any:
    """
    Получение item по ID.
    """
    item = await item_crud.get(item_id=item_id)
    # Логика прав доступа остается в роутере - это его ответственность
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return item


@router.put("/{id}", response_model=ItemPublic)
async def update_item(
        *,
        item_crud: ItemCRUDDep,
        current_user: CurrentUser,
        item_id: Annotated[uuid.UUID, Path(alias="id", description="ID элемента")],
        item_in: ItemUpdate,
) -> Any:
    """
    Обновление item.
    """
    db_item = await item_crud.get(item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (db_item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Вся логика обновления скрыта в одном методе
    item = await item_crud.update(db_item=db_item, item_in=item_in)
    return item


@router.delete("/{id}", response_model=Message)
async def delete_item(
        item_crud: ItemCRUDDep,
        current_user: CurrentUser,
        item_id: Annotated[uuid.UUID, Path(alias="id", description="ID элемента")],
) -> Message:
    """
    Удаление item.
    """
    db_item = await item_crud.get(item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (db_item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await item_crud.remove(item_id=item_id)
    return Message(message="Item deleted successfully")