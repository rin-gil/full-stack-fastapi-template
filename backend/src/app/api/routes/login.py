# app/api/routes/login.py

from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

# ИЗМЕНЕНИЕ 1: Импортируем наши новые, правильные зависимости
from app.api.deps import CurrentUser, CurrentSuperuser, UserCRUDDep
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.core.security import SecurityManager, get_security_manager
from app.models import Message, NewPassword, Token, UserPublic, UserUpdate

# Определяем зависимости, которые будем использовать в этом файле
router = APIRouter(tags=["login"])

# Определяем зависимости, которые будем использовать
SettingsDep = Annotated[Settings, Depends(get_settings)]
EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]
SecurityManagerDep = Annotated[SecurityManager, Depends(get_security_manager)]


@router.post("/login/access-token")
async def login_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        user_crud: UserCRUDDep,
        security_manager: SecurityManagerDep,
        settings: SettingsDep,
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Теперь user_crud - это гарантированно экземпляр UserCRUD
    user = await user_crud.authenticate(
        email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # ИСПРАВЛЕНИЕ ВТОРОЙ ОШИБКИ: Преобразуем UUID в строку
    return Token(
        access_token=security_manager.create_access_token(
            subject=str(user.id), expires_delta=access_token_expires
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    # Этот эндпоинт уже идеален, ничего не меняем
    return current_user


@router.post("/password-recovery/{email}")
async def recover_password(
        email: str,
        user_crud: UserCRUDDep,
        email_manager: EmailManagerDep,
        background_tasks: BackgroundTasks,
) -> Message:
    """
    Password Recovery
    """
    # ИЗМЕНЕНИЕ 3: Используем CRUD-слой для поиска пользователя
    user = await user_crud.get_by_email(email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )

    # ИЗМЕНЕНИЕ 4: Используем один метод из EmailManager
    background_tasks.add_task(email_manager.send_reset_password_email, email_to=email)

    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
async def reset_password(
        body: NewPassword, user_crud: UserCRUDDep, email_manager: EmailManagerDep
) -> Message:
    """
    Reset password
    """
    email = email_manager.verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await user_crud.get_by_email(email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user_update_data = UserUpdate(password=body.new_password)
    await user_crud.update(db_user=user, user_in=user_update_data)

    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    response_class=HTMLResponse,
)
async def recover_password_html_content(
        email: str,
        _: CurrentSuperuser,  # Защита эндпоинта
        email_manager: EmailManagerDep,
) -> Any:
    """
    HTML Content for Password Recovery (for testing/preview).
    """
    # ИЗМЕНЕНИЕ 7: Генерируем токен и контент через EmailManager
    token = email_manager.generate_password_reset_token(email=email)
    email_data = await email_manager._render_template(  # Используем "приватный" метод для превью
        template_name="reset_password.html",
        context={
            "project_name": email_manager._settings.PROJECT_NAME,
            "username": email,
            "email": email,
            "valid_hours": email_manager._settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": f"{email_manager._settings.FRONTEND_URL}/reset-password?token={token}",
        },
    )

    return HTMLResponse(
        content=email_data,
        headers={"subject": f"{email_manager._settings.PROJECT_NAME} - Password recovery for user {email}"}
    )
