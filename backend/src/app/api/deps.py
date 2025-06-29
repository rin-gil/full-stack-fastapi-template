"""Module for dependency injection."""

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

__all__: tuple[str, ...] = ("CurrentSuperuser", "CurrentUser", "ItemCRUDDep", "SessionDep", "UserCRUDDep")


# Basic settings
settings: Settings = get_settings()
security_manager: SecurityManager = get_security_manager()
db_manager: DatabaseManager = get_db_manager()
reusable_oauth2: OAuth2PasswordBearer = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

# Basic dependencies
SessionDep: Type[AsyncSession] = Annotated[AsyncSession, Depends(db_manager.get_session)]
TokenDep: Type[str] = Annotated[str, Depends(reusable_oauth2)]


# Class dependencies for CRUD
class UserCRUDProvider:
    """Class for providing user CRUD dependencies."""

    def __init__(self, session: SessionDep) -> None:
        """
        Initializes the user CRUD provider with a database session.

        :param session: The database session to use for CRUD operations.
        """
        self._session: SessionDep = session

    def __call__(self) -> UserCRUD:
        """
        Creates and returns a 'UserCRUD' object using the stored database session.

        :return: A 'UserCRUD' object with a bound database session.
        """
        return UserCRUD(session=self._session)


class ItemCRUDProvider:
    """Class for providing item CRUD dependencies."""

    def __init__(self, session: SessionDep) -> None:
        """
        Initializes the CRUD provider with a database session.

        :param session: The database session to use for CRUD operations.
        """
        self._session: SessionDep = session

    def __call__(self) -> ItemCRUD:
        """
        Creates and returns an 'ItemCRUD' object using the stored database session.

        :return: An 'ItemCRUD' object with a bound database session.
        """
        return ItemCRUD(session=self._session)


UserCRUDDep: Type[UserCRUD] = Annotated[UserCRUD, Depends(UserCRUDProvider)]
ItemCRUDDep: Type[ItemCRUD] = Annotated[ItemCRUD, Depends(ItemCRUDProvider)]


# Class dependencies for authentication
class CurrentUserProvider:
    """Dependency for obtaining the current user by JWT token."""

    def __init__(self, user_crud: UserCRUDDep, token: TokenDep) -> None:
        """
        Initializes the provider for obtaining the current user by JWT token.

        :param user_crud: The user CRUD dependency
        :param token: The JWT token dependency
        """
        self._user_crud: UserCRUDDep = user_crud
        self._token: str = token

    async def __call__(self) -> User:
        """
        Obtains the current user by JWT token.

        :return: The current user.
        :raises HTTPException: If the token is invalid, or the user does not exist or is inactive.
        """
        try:
            payload: dict = jwt.decode(
                jwt=self._token, key=settings.SECRET_KEY, algorithms=[security_manager.ALGORITHM]
            )
            token_data: TokenPayload = TokenPayload(**payload)
            if token_data.sub is None:
                raise InvalidTokenError("Subject not found in token")
            user_id: UUID = UUID(token_data.sub)
        except (InvalidTokenError, ValidationError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials") from exc
        user: User | None = await self._user_crud.get_by_id(user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        return user


class ActiveSuperuserProvider:
    """Dependency for obtaining the active superuser."""

    def __init__(self, current_user: Annotated[User, Depends(CurrentUserProvider)]) -> None:
        """
        Initializes the provider for obtaining the active superuser.

        :param current_user: The user dependency provider
        """
        self._current_user: User = current_user

    def __call__(self) -> User:
        """
        Obtains the active superuser.

        :return: The active superuser.
        :raises HTTPException: If the user doesn't have enough privileges.
        """
        if not self._current_user.is_superuser:
            raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
        return self._current_user


# Annotated types for use in routers
CurrentUser: Type[User] = Annotated[User, Depends(CurrentUserProvider)]
CurrentSuperuser: Type[User] = Annotated[User, Depends(ActiveSuperuserProvider)]
