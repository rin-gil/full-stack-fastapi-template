# app/api/routes/private.py

from typing import Any, Annotated

# ИЗМЕНЕНИЕ 1: Добавляем BackgroundTasks, Depends и другие импорты
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks

# ИЗМЕНЕНИЕ 2: Импортируем наши новые зависимости и менеджеры
from app.api.deps import UserCRUDDep
from app.core.config import get_settings, Settings
from app.core.emails import EmailManager, get_email_manager
from app.models import UserCreate, UserPublic

# Определяем новую зависимость для EmailManager
EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

router = APIRouter(tags=["private"], prefix="/private")


@router.post("/users/", response_model=UserPublic)
async def create_user(
    *,
    user_in: UserCreate,
    user_crud: UserCRUDDep,
    email_manager: EmailManagerDep,  # ИЗМЕНЕНИЕ 3: Добавляем зависимость EmailManager
    background_tasks: BackgroundTasks, # ИЗМЕНЕНИЕ 4: Добавляем зависимость для фоновых задач
    settings: SettingsDep # ИЗМЕНЕНИЕ 5: Добавляем настройки для проверки emails_enabled
) -> Any:
    """
    Create new user and send new account email.
    """
    existing_user = await user_crud.get_by_email(email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    # Создаем пользователя. Вся логика инкапсулирована в CRUD-методе.
    user = await user_crud.create(user_create=user_in)

    # ИЗМЕНЕНИЕ 6: Добавляем отправку email в фоновой задаче
    if settings.emails_enabled:
        background_tasks.add_task(
            email_manager.send_new_account_email,
            email_to=user_in.email,
            username=user_in.email,
            # Важно: мы берем пароль из входящих данных user_in,
            # так как после создания в объекте user его уже нет в открытом виде.
            password=user_in.password
        )

    return user
