"""Module for login and authentication endpoints."""

from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_utils.cbv import cbv

from app.api.deps import CurrentUser, CurrentSuperuser, UserCrudDep
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.core.security import get_security_manager, SecurityManager
from app.models import Message, NewPassword, Token, UserPublic, UserUpdate, User

__all__: tuple[str] = ("login_router",)


SettingsDep = Annotated[Settings, Depends(get_settings)]
EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]
SecurityManagerDep = Annotated[SecurityManager, Depends(get_security_manager)]
OAuthFormDep = Annotated[OAuth2PasswordRequestForm, Depends()]

login_router: APIRouter = APIRouter()


@cbv(router=login_router)
class LoginRouter:
    """Class-based view for login and authentication endpoints."""

    @login_router.post(
        path="/login/access-token",
        response_model=Token,
        summary="Login for Access Token",
        description="OAuth2 compatible token login, get an access token for future requests.",
    )
    async def login_access_token(
        self,
        form_data: OAuthFormDep,
        user_crud: UserCrudDep,
        security_manager: SecurityManagerDep,
        settings: SettingsDep,
    ) -> Token:
        """
        Endpoint for user login to obtain an access token.

        :param form_data: The OAuth2 password request form data (username and password).
        :param user_crud: Dependency for user CRUD operations.
        :param security_manager: Dependency for security-related operations.
        :param settings: The application settings dependency.
        :return: An access token.
        :raises HTTPException: If login details are incorrect or the user is inactive.
        """
        user: User | None = await user_crud.authenticate(email=form_data.username, password=form_data.password)
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        access_token_expires: timedelta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return Token(
            access_token=security_manager.create_access_token(subject=str(user.id), expires_delta=access_token_expires)
        )

    @login_router.post(
        path="/login/test-token",
        response_model=UserPublic,
        summary="Test Access Token",
        description="Test endpoint to validate an access token.",
    )
    async def test_token(self, current_user: CurrentUser) -> Any:
        """
        Endpoint to test the validity of an access token.

        :param current_user: The currently authenticated user.
        :return: The current user's public data.
        """
        return current_user

    @login_router.post(
        path="/password-recovery/{email}",
        response_model=Message,
        summary="Recover Password",
        description="Send a password recovery email.",
    )
    async def recover_password(
        self, email: str, user_crud: UserCrudDep, email_manager: EmailManagerDep, background_tasks: BackgroundTasks
    ) -> Message:
        """
        Endpoint to initiate password recovery for a user.

        :param email: The email address of the user.
        :param user_crud: Dependency for user CRUD operations.
        :param email_manager: The email manager dependency.
        :param background_tasks: The background tasks service.
        :return: A confirmation message.
        :raises HTTPException: If the user with the provided email is not found.
        """
        user: User | None = await user_crud.get_by_email(email=email)
        if not user:
            raise HTTPException(status_code=404, detail="The user with this email does not exist in the system.")
        background_tasks.add_task(email_manager.send_reset_password_email, email_to=email)
        return Message(message="Password recovery email sent")

    @login_router.post(
        path="/reset-password/",
        response_model=Message,
        summary="Reset Password",
        description="Reset user password using a recovery token.",
    )
    async def reset_password(
        self, body: NewPassword, user_crud: UserCrudDep, email_manager: EmailManagerDep
    ) -> Message:
        """
        Endpoint to reset a user's password using a valid token.

        :param body: The request body containing the token and new password.
        :param user_crud: Dependency for user CRUD operations.
        :param email_manager: The email manager dependency.
        :return: A confirmation message.
        :raises HTTPException: If the token is invalid or the user with the provided email is not found.
        """
        email: str | None = email_manager.verify_password_reset_token(token=body.token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
        user: User | None = await user_crud.get_by_email(email=email)
        if not user:
            raise HTTPException(status_code=404, detail="The user with this email does not exist in the system.")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        user_update_data: UserUpdate = UserUpdate(password=body.new_password)
        await user_crud.update(db_user=user, user_in=user_update_data)
        return Message(message="Password updated successfully")

    # noinspection PyProtectedMember
    # pylint: disable=protected-access
    @login_router.post(
        path="/password-recovery-html-content/{email}",
        response_class=HTMLResponse,
        summary="Get Password Recovery HTML Content",
        description="Get the HTML content of a password recovery email for preview (superusers only).",
    )
    async def recover_password_html_content(
        self, email: str, _: CurrentSuperuser, email_manager: EmailManagerDep
    ) -> HTMLResponse:
        """
        Endpoint to get the HTML content of a password recovery email.

        :param email: The email address to generate the content for.
        :param _: The superuser dependency to enforce permissions.
        :param email_manager: The email manager dependency.
        :return: An HTML response with the email content.
        """
        token: str = email_manager.generate_password_reset_token(email=email)
        email_data: str = await email_manager._render_template(
            template_name="reset_password.html",
            context={
                "project_name": email_manager._settings.PROJECT_NAME,
                "username": email,
                "email": email,
                "valid_hours": email_manager._settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
                "link": f"{email_manager._settings.FRONTEND_HOST}/reset-password?token={token}",
            },
        )
        return HTMLResponse(
            content=email_data,
            headers={"subject": f"{email_manager._settings.PROJECT_NAME} - Password recovery for user {email}"},
        )
