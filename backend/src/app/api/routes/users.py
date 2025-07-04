"""Module for users endpoints."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, status
from fastapi_utils.cbv import cbv

from app.api.deps import CurrentUser, CurrentSuperuser, ItemCrudDep, UserCrudDep
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.core.security import get_security_manager, SecurityManager
from app.models import (
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UsersPublic,
)

__all__: tuple[str] = ("users_router",)

EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
SecurityManagerDep = Annotated[SecurityManager, Depends(get_security_manager)]
UserIdDep = Annotated[UUID, Path(alias="id", description="User ID")]

users_router: APIRouter = APIRouter()


@cbv(router=users_router)
class UsersRouter:
    """Class-based view for user endpoints."""

    def __init__(self, user_crud: UserCrudDep) -> None:
        """
        Initializes the UsersRouter class with the necessary dependencies.

        :param user_crud: Dependency for user CRUD operations.
        """
        self._user_crud: UserCrudDep = user_crud

    @users_router.get(
        path="/",
        response_model=UsersPublic,
        summary="Read Users",
        description="Obtaining a list of users (for superusers only).",
    )
    async def read_users(self, _: CurrentSuperuser, skip: int = 0, limit: int = 100) -> Any:
        """
        Endpoint to retrieve a list of users. Requires superuser privileges.

        :param _: The current superuser dependency to enforce permissions.
        :param skip: The number of users to skip.
        :param limit: The maximum number of users to return.
        :return: A list of users.
        """
        return await self._user_crud.get_multi(skip=skip, limit=limit)

    @users_router.post(
        path="/",
        response_model=UserPublic,
        status_code=status.HTTP_201_CREATED,
        summary="Create User",
        description="Creating a new user (for superusers only).",
    )
    async def create_user(
        self,
        user_in: UserCreate,
        email_manager: EmailManagerDep,
        background_tasks: BackgroundTasks,
        settings: SettingsDep,
        _: CurrentSuperuser,
    ) -> User:
        """
        Endpoint to create a new user. Requires superuser privileges.

        :param user_in: The data for the user to be created.
        :param email_manager: The email manager dependency.
        :param background_tasks: The background tasks service.
        :param settings: The application settings dependency.
        :param _: The current superuser dependency to enforce permissions.
        :return: The newly created user.
        :raises HTTPException: If the user with the given email address already exists in the system.
        """
        user: User | None = await self._user_crud.get_by_email(email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The user with this email already exists in the system."
            )
        new_user: User = await self._user_crud.create(user_create=user_in)
        if settings.emails_enabled:
            background_tasks.add_task(
                email_manager.send_new_account_email,
                email_to=user_in.email,  # type: ignore
                username=user_in.email,  # type: ignore
                password=user_in.password,
            )
        return new_user

    @users_router.get(
        path="/me", response_model=UserPublic, summary="Read Current User", description="Retrieving current user data."
    )
    async def read_user_me(self, current_user: CurrentUser) -> User:
        """
        Endpoint to get the current user's data.

        :param current_user: The currently authenticated user.
        :return: The current user's data.
        """
        return current_user

    @users_router.patch(
        path="/me",
        response_model=UserPublic,
        summary="Update Current User",
        description="Updating the current user's data.",
    )
    async def update_user_me(self, user_in: UserUpdateMe, current_user: CurrentUser) -> User:
        """
        Endpoint for the current user to update their own data.

        :param user_in: The new data for the user.
        :param current_user: The currently authenticated user.
        :return: The updated user data.
        :raises HTTPException: If the user with the given email address already exists in the system.
        """
        if user_in.email:
            existing_user: User | None = await self._user_crud.get_by_email(email=user_in.email)
            if existing_user and existing_user.id != current_user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")
        return await self._user_crud.update(db_user=current_user, user_in=user_in)  # type: ignore

    @users_router.patch(
        path="/me/password",
        response_model=Message,
        summary="Update Current User's Password",
        description="Update the current user's password.",
    )
    async def update_password_me(
        self, body: UpdatePassword, current_user: CurrentUser, security_manager: SecurityManagerDep
    ) -> Message:
        """
        Endpoint for the current user to update their own password.

        :param body: The request body containing current and new passwords.
        :param current_user: The currently authenticated user.
        :param security_manager: The security manager dependency.
        :return: A confirmation message.
        :raises HTTPException: If the current password is incorrect or the new password is the same as the current one.
        """
        if not security_manager.verify_password(
            plain_password=body.current_password, hashed_password=current_user.hashed_password
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
        if body.current_password == body.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="New password cannot be the same as the current one"
            )
        user_update: UserUpdate = UserUpdate(password=body.new_password)
        await self._user_crud.update(db_user=current_user, user_in=user_update)
        return Message(message="Password updated successfully")

    @users_router.delete(
        path="/me", response_model=Message, summary="Delete Current User", description="Delete current user."
    )
    async def delete_user_me(self, current_user: CurrentUser) -> Message:
        """
        Endpoint for the current user to delete their own account.

        :param current_user: The currently authenticated user.
        :return: A confirmation message.
        :raises HTTPException: If the current user is a superuser.
        """
        if current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Super users are not allowed to delete themselves"
            )
        await self._user_crud.remove(user_id=current_user.id)
        return Message(message="User deleted successfully")

    @users_router.post(
        path="/signup",
        response_model=UserPublic,
        status_code=status.HTTP_201_CREATED,
        summary="Register New User",
        description="New user registration.",
    )
    async def register_user(self, user_in: UserRegister) -> User:
        """
        Endpoint for new user registration.

        :param user_in: The registration data.
        :return: The newly created user.
        :raises HTTPException: If the user with the given email address already exists in the system.
        """
        user: User | None = await self._user_crud.get_by_email(email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The user with this email already exists in the system"
            )
        user_create: UserCreate = UserCreate.model_validate(obj=user_in)
        return await self._user_crud.create(user_create=user_create)

    @users_router.get(
        path="/{id}", response_model=UserPublic, summary="Read User by ID", description="Retrieving user data by ID."
    )
    async def read_user_by_id(self, user_id: UserIdDep, current_user: CurrentUser) -> User:
        """
        Endpoint to retrieve a user's data by their ID.

        :param user_id: The ID of the user to retrieve.
        :param current_user: The currently authenticated user.
        :return: The requested user's data.
        :raises HTTPException: If the user with the given ID is not found.
        """
        user: User | None = await self._user_crud.get_by_id(user_id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.id == current_user.id:
            return user
        if not current_user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges")
        return user

    @users_router.patch(
        path="/{id}",
        response_model=UserPublic,
        summary="Update User by ID",
        description="Update user by ID (for superusers only).",
    )
    async def update_user(self, user_id: UserIdDep, user_in: UserUpdate, _: CurrentSuperuser) -> User:
        """
        Endpoint to update a user by their ID. Requires superuser privileges.

        :param user_id: The ID of the user to update.
        :param user_in: The new data for the user.
        :param _: The superuser dependency to enforce permissions.
        :return: The updated user data.
        :raises HTTPException: If the user with the given ID is not found
                               or if a user with the same email already exists.
        """
        db_user: User | None = await self._user_crud.get_by_id(user_id=user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="The user with this id does not exist in the system"
            )
        if user_in.email:
            existing_user: User | None = await self._user_crud.get_by_email(email=user_in.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")
        return await self._user_crud.update(db_user=db_user, user_in=user_in)

    @users_router.delete(
        path="/{id}",
        response_model=Message,
        summary="Delete User by ID",
        description="Delete a user by their ID (superusers only).",
    )
    async def delete_user(
        self, user_id: UserIdDep, item_crud: ItemCrudDep, current_superuser: CurrentSuperuser
    ) -> Message:
        """
        Endpoint to delete a user by their ID. Requires superuser privileges.

        :param user_id: The ID of the user to delete.
        :param item_crud: Dependency for item CRUD operations for cascade delete.
        :param current_superuser: The currently authenticated superuser, used for permission checks.
        :return: A confirmation message.
        :raises HTTPException: If the user is not found or tries to delete themselves.
        """
        user_to_delete: User | None = await self._user_crud.get_by_id(user_id=user_id)
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
        if user_to_delete.id == current_superuser.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Super users are not allowed to delete themselves"
            )
        await item_crud.remove_by_owner(owner_id=user_id)
        await self._user_crud.remove(user_id=user_id)
        return Message(message="User deleted successfully")
