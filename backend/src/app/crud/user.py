"""Module for User CRUD operations for User model."""

from typing import Any
from uuid import UUID

from sqlalchemy import func, ScalarResult
from sqlmodel import select

# noinspection PyProtectedMember
from sqlmodel.sql._expression_select_cls import SelectOfScalar

from app.core.security import SecurityManager, get_security_manager
from app.crud.base import BaseCRUD
from app.models import User, UserCreate, UserUpdate, UsersPublic

__all__: tuple[str] = ("UserCRUD",)


class UserCRUD(BaseCRUD):
    """CRUD operations for User model."""

    _security: SecurityManager = get_security_manager()

    async def create(self, *, user_create: UserCreate) -> User:
        """
        Create a new user in the database.

        :param user_create: User creation data
        :return: Created User object
        """
        user_data: dict[str, Any] = user_create.model_dump()
        hashed_password: str = self._security.get_password_hash(password=user_data["password"])
        user_obj: User = User(**user_data, hashed_password=hashed_password)
        self._session.add(instance=user_obj)
        await self._session.commit()
        await self._session.refresh(instance=user_obj)
        return user_obj

    async def update(self, *, db_user: User, user_in: UserUpdate) -> User:
        """
        Update an existing user in the database.

        :param db_user: User object to update
        :param user_in: User update data
        :return: Updated User object
        """
        user_data: dict[str, Any] = user_in.model_dump(exclude_unset=True)
        extra_data: dict[str, str] = {}
        if "password" in user_data:
            password: str = user_data["password"]
            hashed_password: str = self._security.get_password_hash(password=password)
            extra_data["hashed_password"] = hashed_password
        db_user.sqlmodel_update(obj=user_data, update=extra_data)
        self._session.add(instance=db_user)
        await self._session.commit()
        await self._session.refresh(instance=db_user)
        return db_user

    async def get_by_id(self, *, user_id: UUID) -> User | None:
        """
        Retrieve a user by their ID.

        :param user_id: The UUID of the user.
        :return: User object or None if not found.
        """
        return await self._session.get(entity=User, ident=user_id)

    async def get_by_email(self, *, email: str) -> User | None:
        """
        Retrieve a user by email.

        :param email: User's email address
        :return: User object or None if not found
        """
        statement: SelectOfScalar = select(User).where(User.email == email)
        result: ScalarResult = await self._session.exec(statement=statement)
        return result.first()

    async def authenticate(self, *, email: str, password: str) -> User | None:
        """
        Authenticate a user by email and password.

        :param email: User's email address
        :param password: User's password
        :return: Authenticated User object or None if authentication fails
        """
        db_user: User | None = await self.get_by_email(email=email)
        if not db_user:
            return None
        if not self._security.verify_password(plain_password=password, hashed_password=db_user.hashed_password):
            return None
        return db_user

    async def get_multi(self, *, skip: int = 0, limit: int = 100) -> UsersPublic:
        """
        Retrieve multiple users from the database (for superusers).

        :param skip: The number of users to skip from the start of the query.
        :param limit: The maximum number of users to return.
        :return: A UsersPublic object containing a list of users and the total count of users.
        """
        count_statement: SelectOfScalar = select(func.count()).select_from(User.__table__)
        count: int = (await self._session.exec(statement=count_statement)).one()
        statement: SelectOfScalar = select(User).offset(skip).limit(limit)
        result: ScalarResult = await self._session.exec(statement=statement)
        users = [user for user, in result.all()]
        return UsersPublic(data=users, count=count)

    async def remove(self, *, user_id: UUID) -> User | None:
        """
        Deletes a user from the database.

        :param user_id: The UUID of the user to delete.
        :return: The deleted User object, or None if no user was found.
        """
        db_user: User | None = await self.get_by_id(user_id=user_id)
        if db_user:
            await self._session.delete(instance=db_user)
            await self._session.commit()
        return db_user
