# app/api/routes/users.py

import uuid
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Path, status

# ИЗМЕНЕНИЕ: Импортируем все необходимые зависимости и модели
from app.api.deps import (
    CurrentUser,
    CurrentSuperuser,
    UserCRUDDep,
    ItemCRUDDep, # Нужен для каскадного удаления
)
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.core.security import SecurityManager, get_security_manager
from app.models import (
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])

# Локальные зависимости для этого модуля
EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
SecurityManagerDep = Annotated[SecurityManager, Depends(get_security_manager)]


@router.get("/", response_model=UsersPublic)
async def read_users(
    user_crud: UserCRUDDep,
    _: CurrentSuperuser, # Защита эндпоинта
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получение списка пользователей (только для суперпользователей).
    """
    users: UsersPublic = await user_crud.get_multi(skip=skip, limit=limit)
    return users


@router.post("/", response_model=UserPublic)
async def create_user(
    user_in: UserCreate,
    user_crud: UserCRUDDep,
    email_manager: EmailManagerDep,
    background_tasks: BackgroundTasks,
    settings: SettingsDep,
    _: CurrentSuperuser, # Защита эндпоинта
) -> Any:
    """
    Создание нового пользователя (только для суперпользователей).
    """
    user = await user_crud.get_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await user_crud.create(user_create=user_in)
    if settings.emails_enabled:
        background_tasks.add_task(
            email_manager.send_new_account_email,
            email_to=user_in.email,
            username=user_in.email,
            password=user_in.password,
        )
    return user


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> Any:
    """
    Получение данных текущего пользователя.
    """
    return current_user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    user_in: UserUpdateMe,
    current_user: CurrentUser,
    user_crud: UserCRUDDep,
) -> Any:
    """
    Обновление данных текущего пользователя.
    """
    if user_in.email:
        existing_user = await user_crud.get_by_email(email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )
    # Используем CRUD-метод для обновления
    return await user_crud.update(db_user=current_user, user_in=user_in)


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    body: UpdatePassword,
    current_user: CurrentUser,
    user_crud: UserCRUDDep,
    security_manager: SecurityManagerDep,
) -> Message:
    """
    Обновление пароля текущего пользователя.
    """
    if not security_manager.verify_password(
        body.current_password, current_user.hashed_password
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the current one",
        )
    # Используем UserUpdate схему и CRUD-метод
    user_update = UserUpdate(password=body.new_password)
    await user_crud.update(db_user=current_user, user_in=user_update)
    return Message(message="Password updated successfully")


@router.delete("/me", response_model=Message)
async def delete_user_me(current_user: CurrentUser, user_crud: UserCRUDDep) -> Message:
    """
    Удаление текущего пользователя.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super users are not allowed to delete themselves",
        )
    await user_crud.remove(user_id=current_user.id)
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
async def register_user(user_in: UserRegister, user_crud: UserCRUDDep) -> Any:
    """
    Регистрация нового пользователя.
    """
    user = await user_crud.get_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    return await user_crud.create(user_create=user_create)


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    current_user: CurrentUser,
    user_crud: UserCRUDDep,
    user_id: Annotated[uuid.UUID, Path(alias="id")],
) -> Any:
    """
    Получение данных пользователя по ID.
    """
    user = await user_crud.get_by_id(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.patch("/{user_id}", response_model=UserPublic)
async def update_user(
    user_in: UserUpdate,
    user_crud: UserCRUDDep,
    _: CurrentSuperuser,
    user_id: Annotated[uuid.UUID, Path(alias="id")],
) -> Any:
    """
    Обновление пользователя по ID (только для суперпользователей).
    """
    db_user = await user_crud.get_by_id(user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = await user_crud.get_by_email(email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )
    return await user_crud.update(db_user=db_user, user_in=user_in)


@router.delete("/{user_id}", response_model=Message)
async def delete_user(
    current_user: CurrentUser,
    user_crud: UserCRUDDep,
    item_crud: ItemCRUDDep,
    _: CurrentSuperuser,
    user_id: Annotated[uuid.UUID, Path(alias="id")],
) -> Message:
    """
    Удаление пользователя (только для суперпользователей).
    """
    user_to_delete = await user_crud.get_by_id(user_id=user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    if user_to_delete.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super users are not allowed to delete themselves",
        )
    # Каскадное удаление
    await item_crud.remove_by_owner(owner_id=user_id)
    await user_crud.remove(user_id=user_id)
    return Message(message="User deleted successfully")
