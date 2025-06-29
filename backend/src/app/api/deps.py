# backend/src/app/api/deps.py (ИСПРАВЛЕННАЯ, ФИНАЛЬНАЯ ВЕРСИЯ)

from typing import Annotated, Type
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings, Settings
from app.core.db import get_db_manager, DatabaseManager
from app.core.security import get_security_manager, SecurityManager
from app.crud.item import ItemCRUD
from app.crud.user import UserCRUD
from app.models import TokenPayload, User

__all__: tuple[str, ...] = ("CurrentUser", "CurrentSuperuser", "ItemCRUDDep", "UserCRUDDep")

# Basic settings
settings: Settings = get_settings()
db_manager: DatabaseManager = get_db_manager()
reusable_oauth2: OAuth2PasswordBearer = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

# --- ИЗМЕНЕНИЕ 1: ЗАМЕНЯЕМ ВСЕ ПРОВАЙДЕРЫ НА ФУНКЦИИ ---

# Зависимость сессии
SessionDep = Annotated[AsyncSession, Depends(db_manager.get_session)]

# CRUD зависимости
def get_user_crud(session: SessionDep) -> UserCRUD:
    return UserCRUD(session=session)

def get_item_crud(session: SessionDep) -> ItemCRUD:
    return ItemCRUD(session=session)

UserCRUDDep = Annotated[UserCRUD, Depends(get_user_crud)]
ItemCRUDDep = Annotated[ItemCRUD, Depends(get_item_crud)]

# Зависимости аутентификации
TokenDep = Annotated[str, Depends(reusable_oauth2)]
SecurityManagerDep = Annotated[SecurityManager, Depends(get_security_manager)]

async def get_current_user(
    token: TokenDep, user_crud: UserCRUDDep, security_manager: SecurityManagerDep
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security_manager.ALGORITHM]
        )
        user_id = UUID(payload["sub"])
    except (InvalidTokenError, ValidationError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        ) from e

    user = await user_crud.get_by_id(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


# Финальные псевдонимы, которые мы используем в роутерах.
# Их реализация изменилась, но имена остались те же.
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentSuperuser = Annotated[User, Depends(get_current_active_superuser)]