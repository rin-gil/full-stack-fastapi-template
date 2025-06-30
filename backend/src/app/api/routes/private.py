"""Module for private endpoints."""

from typing import Annotated, Type

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi_utils.cbv import cbv

from app.api.deps import UserCRUDDep
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.models import UserCreate, UserPublic, User

__all__: tuple[str, ...] = ("private_router",)


EmailManagerDep: Type[EmailManager] = Annotated[EmailManager, Depends(get_email_manager)]
SettingsDep: Type[Settings] = Annotated[Settings, Depends(get_settings)]

private_router: APIRouter = APIRouter()


@cbv(router=private_router)
class PrivateRouter:
    """Router for private endpoints."""

    def __init__(self, user_crud: UserCRUDDep, email_manager: EmailManagerDep, settings: SettingsDep) -> None:
        """
        Initializes the PrivateRouter class with the necessary dependencies.

        :param user_crud: Dependency for user CRUD operations.
        :param email_manager: Dependency for email management operations.
        :param settings: Dependency for application settings.
        """
        self._user_crud: UserCRUDDep = user_crud
        self._email_manager: EmailManagerDep = email_manager
        self._settings: SettingsDep = settings

    @private_router.post(
        path="/users/",
        response_model=UserPublic,
        summary="Create User",
        status_code=status.HTTP_201_CREATED,
        description="Create new user and send new account email.",
    )
    async def create_user(self, user_in: UserCreate, background_tasks: BackgroundTasks) -> User:
        """
        Create new user and send new account email.

        :param user_in: The data for the user to be created.
        :param background_tasks: The background tasks service.
        :return: The newly created user.
        :raises HTTPException: If the user with the given email address already exists in the system.
        """
        existing_user: User | None = await self._user_crud.get_by_email(email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The user with this email already exists in the system."
            )
        user: User = await self._user_crud.create(user_create=user_in)
        if self._settings.emails_enabled:
            background_tasks.add_task(
                func=self._email_manager.send_new_account_email,
                email_to=user_in.email,
                username=user_in.email,
                password=user_in.password,
            )
        return user
