# app/api/routes/utils.py

from typing import Annotated

from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic.networks import EmailStr

# ИЗМЕНЕНИЕ 1: Импортируем CurrentSuperuser (он существует и экспортируется)
from app.api.deps import CurrentSuperuser
from app.core.emails import EmailManager, get_email_manager
from app.models import Message

EmailManagerDep = Annotated[EmailManager, Depends(get_email_manager)]

router = APIRouter(prefix="/utils", tags=["utils"])


@router.post(
    "/test-email/",
    status_code=201,
)
async def test_email(
    email_to: EmailStr,
    background_tasks: BackgroundTasks,
    email_manager: EmailManagerDep,
    # ИЗМЕНЕНИЕ 2: Используем зависимость CurrentSuperuser.
    # Это вызовет проверку прав. Имя переменной `_` говорит, что результат нам не нужен.
    _: CurrentSuperuser,
) -> Message:
    """
    Test emails. Requires superuser privileges.
    """
    background_tasks.add_task(email_manager.send_test_email, email_to=email_to)
    return Message(message="Test email sent")


@router.get("/health-check/")
async def health_check() -> Message:
    """
    Health check endpoint.
    """
    return Message(message="OK")