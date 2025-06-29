"""Unit tests for backend/src/app/emails.py"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from jinja2 import Environment
from jwt.exceptions import InvalidTokenError
from pytest_mock import MockerFixture

from app.core.config import Settings
from app.core.security import SecurityManager
from app.emails import EmailManager, get_email_manager

__all__: tuple = ()


# noinspection PyPropertyAccess
@pytest.fixture
def mock_settings(mocker: MockerFixture) -> Settings:
    """
    Mocks the Settings object for testing.

    :param mocker: Pytest mocker fixture.
    :return: Mocked Settings object.
    """
    settings: Settings = mocker.create_autospec(spec=Settings, instance=True)
    settings.emails_enabled = True
    settings.SMTP_USER = "user"
    settings.SMTP_PASSWORD = "password"
    settings.EMAILS_FROM_EMAIL = "from@example.com"
    settings.EMAILS_FROM_NAME = "Test"
    settings.SMTP_PORT = 587
    settings.SMTP_HOST = "smtp.example.com"
    settings.SMTP_TLS = True
    settings.SMTP_SSL = False
    settings.PROJECT_NAME = "Test Project"
    settings.SECRET_KEY = "secret_key"
    settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS = 24
    settings.FRONTEND_URL = "http://frontend.com"
    settings.BASE_DIR = Path("/app")
    return settings


@pytest.fixture
def mock_security_manager(mocker: MockerFixture) -> SecurityManager:
    """
    Mocks the SecurityManager object for testing.

    :param mocker: Pytest mocker fixture.
    :return: Mocked SecurityManager object.
    """
    security_manager: SecurityManager = mocker.create_autospec(spec=SecurityManager, instance=True)
    security_manager.ALGORITHM = "HS256"
    return security_manager


@pytest.fixture
def mock_jinja_env(mocker: MockerFixture) -> Environment:
    """
    Mocks the Jinja2 Environment object for testing.

    :param mocker: Pytest mocker fixture.
    :return: Mocked Environment object.
    """
    env: Environment = mocker.create_autospec(spec=Environment, instance=True)
    template_mock: MagicMock = MagicMock()
    template_mock.render_async = AsyncMock(return_value="<html>mocked content</html>")
    env.get_template.return_value = template_mock
    return env


# noinspection PyPropertyAccess
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "emails_enabled, expected_mailer_config", [(True, True), (False, False)], ids=["emails_enabled", "emails_disabled"]
)
async def test_email_manager_init(
    mocker: MockerFixture,
    mock_settings: Settings,
    mock_security_manager: SecurityManager,
    mock_jinja_env: Environment,
    emails_enabled: bool,
    expected_mailer_config: bool,
) -> None:
    """
    Test the initialization of the EmailManager class.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param mock_jinja_env: Mocked Jinja2 Environment object.
    :param emails_enabled: Whether emails are enabled in settings.
    :param expected_mailer_config: Whether mailer config should be initialized.
    :return: None
    """
    mock_settings.emails_enabled = emails_enabled
    mocker.patch(target="app.emails.Environment", return_value=mock_jinja_env)
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    assert email_manager._settings is mock_settings
    assert email_manager._security_manager is mock_security_manager
    assert email_manager._is_enabled == emails_enabled
    assert (email_manager._mailer_config is not None) == expected_mailer_config
    if emails_enabled:
        assert isinstance(email_manager._mailer_config, ConnectionConfig)
        assert email_manager._mailer_config.MAIL_USERNAME == mock_settings.SMTP_USER
        assert email_manager._mailer_config.MAIL_PASSWORD.get_secret_value() == mock_settings.SMTP_PASSWORD
        assert email_manager._mailer_config.MAIL_FROM == mock_settings.EMAILS_FROM_EMAIL
        assert email_manager._mailer_config.MAIL_FROM_NAME == mock_settings.EMAILS_FROM_NAME
        assert email_manager._mailer_config.MAIL_PORT == mock_settings.SMTP_PORT
        assert email_manager._mailer_config.MAIL_SERVER == mock_settings.SMTP_HOST
        assert email_manager._mailer_config.MAIL_STARTTLS == mock_settings.SMTP_TLS
        assert email_manager._mailer_config.MAIL_SSL_TLS == mock_settings.SMTP_SSL
        assert email_manager._mailer_config.USE_CREDENTIALS == bool(mock_settings.SMTP_USER)
        assert email_manager._mailer_config.VALIDATE_CERTS is True
    assert email_manager._jinja_env is mock_jinja_env


@pytest.mark.asyncio
async def test_render_template(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager, mock_jinja_env: Environment
) -> None:
    """
    Test the _render_template method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param mock_jinja_env: Mocked Jinja2 Environment object.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    mocker.patch.object(target=email_manager, attribute="_jinja_env", new=mock_jinja_env)
    template_name: str = "test_email.html"
    context: dict = {"key": "value"}
    result: str = await email_manager._render_template(template_name=template_name, context=context)
    mock_jinja_env.get_template.assert_called_once_with(name=template_name)
    mock_jinja_env.get_template.return_value.render_async.assert_called_once_with(context)
    assert result == "<html>mocked content</html>"


# noinspection PyPropertyAccess
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "emails_enabled, mailer_config_exists, should_send, expect_error",
    [(True, True, True, False), (False, False, False, False), (True, True, True, True)],
    ids=["success", "emails_disabled", "send_error"],
)
async def test_send_email(
    mocker: MockerFixture,
    mock_settings: Settings,
    mock_security_manager: SecurityManager,
    emails_enabled: bool,
    mailer_config_exists: bool,
    should_send: bool,
    expect_error: bool,
) -> None:
    """
    Test the _send_email method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param emails_enabled: Whether emails are enabled in settings.
    :param mailer_config_exists: Whether mailer config is initialized.
    :param should_send: Whether email sending should be attempted.
    :param expect_error: Whether an error is expected during sending.
    :return: None
    """
    mock_settings.emails_enabled = emails_enabled
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    if not mailer_config_exists:
        email_manager._mailer_config = None
    mock_fast_mail: AsyncMock = AsyncMock(spec=FastMail)
    if expect_error:
        mock_fast_mail.send_message.side_effect = Exception("Send error")
    mocker.patch(target="app.emails.FastMail", return_value=mock_fast_mail)
    mock_logger: MagicMock = mocker.patch("app.emails.logger")
    email_to: str = "test@example.com"
    subject: str = "Test Subject"
    html_content: str = "<html>Test</html>"
    await email_manager._send_email(email_to=email_to, subject=subject, html_content=html_content)
    if should_send:
        mock_fast_mail.send_message.assert_called_once_with(
            message=MessageSchema(subject=subject, recipients=[email_to], body=html_content, subtype="html")
        )
        if expect_error:
            mock_logger.error.assert_called_once_with(f"Failed to send email to {email_to}. Error: Send error")
        else:
            mock_logger.info.assert_called_once_with(f"Email sent to {email_to} with subject '{subject}'")
    else:
        mock_fast_mail.send_message.assert_not_called()
        mock_logger.warning.assert_called_once_with(
            "Email sending is disabled or not configured. The letter has not been sent."
        )


@pytest.mark.asyncio
async def test_generate_password_reset_token(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager
) -> None:
    """
    Test the generate_password_reset_token method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    email: str = "test@example.com"
    mock_jwt_encode: MagicMock = mocker.patch("jwt.encode")
    now: datetime = datetime.now(tz=timezone.utc)
    mocker.patch(target="app.emails.datetime").now.return_value = now
    result: str = email_manager.generate_password_reset_token(email=email)
    expected_expires: datetime = now + timedelta(hours=mock_settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    mock_jwt_encode.assert_called_once_with(
        payload={"exp": expected_expires.timestamp(), "nbf": now, "sub": email},
        key=mock_settings.SECRET_KEY,
        algorithm=mock_security_manager.ALGORITHM,
    )
    assert result == mock_jwt_encode.return_value


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "jwt_decode_result, expected_result",
    [({"sub": "test@example.com"}, "test@example.com"), (InvalidTokenError("Invalid token"), None)],
    ids=["valid_token", "invalid_token"],
)
async def test_verify_password_reset_token(
    mocker: MockerFixture,
    mock_settings: Settings,
    mock_security_manager: SecurityManager,
    jwt_decode_result: dict | InvalidTokenError,
    expected_result: str | None,
) -> None:
    """
    Test the verify_password_reset_token method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param jwt_decode_result: Result of jwt.decode (valid payload or exception).
    :param expected_result: Expected result of the method.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    token: str = "mocked_token"
    mock_jwt_decode: MagicMock = mocker.patch(target="jwt.decode")
    if isinstance(jwt_decode_result, dict):
        mock_jwt_decode.return_value = jwt_decode_result
    else:
        mock_jwt_decode.side_effect = jwt_decode_result
    result: str | None = email_manager.verify_password_reset_token(token=token)
    mock_jwt_decode.assert_called_once_with(
        jwt=token, key=mock_settings.SECRET_KEY, algorithms=[mock_security_manager.ALGORITHM]
    )
    assert result == expected_result


@pytest.mark.asyncio
async def test_send_test_email(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager, mock_jinja_env: Environment
) -> None:
    """
    Test the send_test_email method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param mock_jinja_env: Mocked Jinja2 Environment object.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    mocker.patch.object(target=email_manager, attribute="_jinja_env", new=mock_jinja_env)
    mock_send_email: AsyncMock = AsyncMock()
    mocker.patch.object(target=email_manager, attribute="_send_email", new=mock_send_email)
    email_to: str = "test@example.com"
    await email_manager.send_test_email(email_to=email_to)
    mock_jinja_env.get_template.assert_called_once_with(name="test_email.html")
    mock_jinja_env.get_template.return_value.render_async.assert_called_once_with(
        {"project_name": mock_settings.PROJECT_NAME, "email": email_to}
    )
    mock_send_email.assert_called_once_with(
        email_to=email_to,
        subject=f"{mock_settings.PROJECT_NAME} - Test email",
        html_content="<html>mocked content</html>",
    )


@pytest.mark.asyncio
async def test_send_reset_password_email(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager, mock_jinja_env: Environment
) -> None:
    """
    Test the send_reset_password_email method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param mock_jinja_env: Mocked Jinja2 Environment object.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    mocker.patch.object(target=email_manager, attribute="_jinja_env", new=mock_jinja_env)
    mock_generate_token: MagicMock = MagicMock(return_value="mocked_token")
    mocker.patch.object(target=email_manager, attribute="generate_password_reset_token", new=mock_generate_token)
    mock_send_email: AsyncMock = AsyncMock()
    mocker.patch.object(target=email_manager, attribute="_send_email", new=mock_send_email)
    email_to: str = "test@example.com"
    await email_manager.send_reset_password_email(email_to=email_to)
    mock_generate_token.assert_called_once_with(email=email_to)
    mock_jinja_env.get_template.assert_called_once_with(name="reset_password.html")
    mock_jinja_env.get_template.return_value.render_async.assert_called_once_with(
        {
            "project_name": mock_settings.PROJECT_NAME,
            "username": email_to,
            "email": email_to,
            "valid_hours": mock_settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": f"{mock_settings.FRONTEND_URL}/reset-password?token=mocked_token",
        }
    )
    mock_send_email.assert_called_once_with(
        email_to=email_to,
        subject=f"{mock_settings.PROJECT_NAME} - Password recovery for user {email_to}",
        html_content="<html>mocked content</html>",
    )


@pytest.mark.asyncio
async def test_send_new_account_email(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager, mock_jinja_env: Environment
) -> None:
    """
    Test the send_new_account_email method of EmailManager.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :param mock_jinja_env: Mocked Jinja2 Environment object.
    :return: None
    """
    email_manager: EmailManager = EmailManager(settings=mock_settings, security_manager=mock_security_manager)
    mocker.patch.object(target=email_manager, attribute="_jinja_env", new=mock_jinja_env)
    mock_send_email: AsyncMock = AsyncMock()
    mocker.patch.object(target=email_manager, attribute="_send_email", new=mock_send_email)
    email_to: str = "test@example.com"
    username: str = "test_user"
    password: str = "password123"
    await email_manager.send_new_account_email(email_to=email_to, username=username, password=password)
    mock_jinja_env.get_template.assert_called_once_with(name="new_account.html")
    mock_jinja_env.get_template.return_value.render_async.assert_called_once_with(
        {
            "project_name": mock_settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": mock_settings.FRONTEND_URL,
        }
    )
    mock_send_email.assert_called_once_with(
        email_to=email_to,
        subject=f"{mock_settings.PROJECT_NAME} - New account for user {username}",
        html_content="<html>mocked content</html>",
    )


@pytest.mark.asyncio
async def test_get_email_manager_caching(
    mocker: MockerFixture, mock_settings: Settings, mock_security_manager: SecurityManager
) -> None:
    """
    Test the get_email_manager function caching with lru_cache.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings object.
    :param mock_security_manager: Mocked SecurityManager object.
    :return: None
    """
    get_email_manager.cache_clear()
    mock_get_settings: MagicMock = mocker.patch(target="app.emails.get_settings", return_value=mock_settings)
    mock_get_security_manager: MagicMock = mocker.patch(
        target="app.emails.get_security_manager", return_value=mock_security_manager
    )
    email_manager1: EmailManager = get_email_manager()
    email_manager2: EmailManager = get_email_manager()
    assert email_manager1 is email_manager2
    mock_get_settings.assert_called_once()
    mock_get_security_manager.assert_called_once()
