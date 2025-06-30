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
from app.models import User

__all__: tuple[str, ...] = ("CurrentUser", "CurrentSuperuser", "ItemCRUDDep", "OptionalCurrentUser", "UserCRUDDep")

# Basic settings
settings: Settings = get_settings()
db_manager: DatabaseManager = get_db_manager()
token_url: str = f"{settings.API_V1_STR}/login/access-token"

# Creating two versions of the OAuth2 scheme
# Strict version for mandatory authentication
reusable_oauth2_strict: OAuth2PasswordBearer = OAuth2PasswordBearer(tokenUrl=token_url)
# Flexible version for optional authentication (does not crash with an error)
reusable_oauth2_optional: OAuth2PasswordBearer = OAuth2PasswordBearer(tokenUrl=token_url, auto_error=False)

# Basic dependencies
SessionDep: Type[AsyncSession] = Annotated[AsyncSession, Depends(db_manager.get_session)]
SecurityManagerDep: Type[SecurityManager] = Annotated[SecurityManager, Depends(get_security_manager)]
# Creating two versions of token dependency
StrictTokenDep: Type[str] = Annotated[str, Depends(reusable_oauth2_strict)]
OptionalTokenDep: Type[str | None] = Annotated[str | None, Depends(reusable_oauth2_optional)]


# Class dependencies for CRUD
class UserCRUDProvider:
    """Class dependency for providing UserCRUD."""

    def __call__(self, session: SessionDep) -> UserCRUD:
        """Instantiate UserCRUD with a given session.

        :param session: An asynchronous session to perform database operations.
        :return: An instance of UserCRUD.
        """
        return UserCRUD(session=session)


class ItemCRUDProvider:
    """Class dependency for providing ItemCRUD."""

    def __call__(self, session: SessionDep) -> ItemCRUD:
        """
        Instantiate ItemCRUD with a given session.

        :param session: An asynchronous session to perform database operations.
        :return: An instance of ItemCRUD.
        """
        return ItemCRUD(session=session)


UserCRUDDep: Type[UserCRUD] = Annotated[UserCRUD, Depends(UserCRUDProvider())]
ItemCRUDDep: Type[ItemCRUD] = Annotated[ItemCRUD, Depends(ItemCRUDProvider())]


# Class dependencies for authentication
class CurrentUserProvider:
    """Class dependency for obtaining the current user (strict)."""

    async def __call__(
        self, token: StrictTokenDep, user_crud: UserCRUDDep, security_manager: SecurityManagerDep
    ) -> User:
        """
        Retrieve the current user based on the provided JWT token.

        :param token: The JWT token extracted from the request, used for authentication (strict).
        :param user_crud: An instance of UserCRUD to perform user retrieval operations.
        :param security_manager: An instance of SecurityManager to handle token decoding.
        :return: The User object corresponding to the token's subject (user ID).
        :raises HTTPException: If the token is invalid, the user is not found, or the user is inactive.
        """
        try:
            payload: dict = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=[security_manager.ALGORITHM])
            user_id: UUID = UUID(hex=payload["sub"])
        except (InvalidTokenError, ValidationError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials") from exc
        user: User | None = await user_crud.get_by_id(user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        return user


class OptionalCurrentUserProvider:
    """Class dependency for optionally obtaining the current user."""

    async def __call__(
        self, token: OptionalTokenDep, user_crud: UserCRUDDep, security_manager: SecurityManagerDep
    ) -> User | None:
        """
        Retrieve the current user based on the provided JWT token.

        :param token: The JWT token extracted from the request, used for authentication (optional).
        :param user_crud: An instance of UserCRUD to perform user retrieval operations.
        :param security_manager: An instance of SecurityManager to handle token decoding.
        :return: The User object corresponding to the token's subject (user ID).
        :raises HTTPException: If the token is invalid, the user is not found, or the user is inactive.
        """
        if not token:
            return None
        try:
            payload: dict = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=[security_manager.ALGORITHM])
            user_id: UUID = UUID(hex=payload["sub"])
            user: User | None = await user_crud.get_by_id(user_id=user_id)
            if user and not user.is_active:
                return None
            return user
        except (InvalidTokenError, ValidationError, ValueError):
            return None


class ActiveSuperuserProvider:
    """Class dependency for obtaining the currently active superuser."""

    def __call__(self, current_user: Annotated[User, Depends(CurrentUserProvider())]) -> User:
        """
        Retrieve the currently active superuser.

        :param current_user: The current user, injected by the `CurrentUserProvider`.
        :return: The User object corresponding to the current superuser.
        :raises HTTPException: If the current user is not a superuser.
        """
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
        return current_user


# Final pseudonyms
CurrentUser: Type[User] = Annotated[User, Depends(CurrentUserProvider())]
CurrentSuperuser: Type[User] = Annotated[User, Depends(ActiveSuperuserProvider())]
OptionalCurrentUser: Type[User | None] = Annotated[User | None, Depends(OptionalCurrentUserProvider())]
