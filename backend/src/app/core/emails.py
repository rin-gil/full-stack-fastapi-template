"""A module for managing all email-related operations."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import jwt
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from jinja2 import Template, Environment, FileSystemLoader, select_autoescape
from jwt.exceptions import InvalidTokenError

# noinspection PyProtectedMember
from loguru._logger import Logger

from app.core.config import Settings, get_settings
from app.core.log_setup import get_logger
from app.core.security import SecurityManager, get_security_manager

__all__: tuple[str, ...] = ("EmailManager", "get_email_manager",)


logger: Logger = get_logger()


@dataclass
class EmailData:
    """
    A helper class for storing the generated letter.

    :param html_content: The HTML content of the letter.
    :param subject: The subject of the letter.
    """

    html_content: str
    subject: str


class EmailManager:
    """A class for managing all operations related to email."""

    def __init__(self, settings: Settings, security_manager: SecurityManager) -> None:
        """
        Initializes the email manager.

        :param settings: The application settings object.
        :param security_manager: The security manager instance.
        """
        self._settings: Settings = settings
        self._security_manager: SecurityManager = security_manager
        self._is_enabled: bool = settings.emails_enabled
        self._mailer_config: ConnectionConfig | None = None
        if self._is_enabled:
            self._mailer_config = ConnectionConfig(
                MAIL_USERNAME=self._settings.SMTP_USER,
                MAIL_PASSWORD=self._settings.SMTP_PASSWORD,
                MAIL_FROM=self._settings.EMAILS_FROM_EMAIL,
                MAIL_FROM_NAME=self._settings.EMAILS_FROM_NAME,
                MAIL_PORT=self._settings.SMTP_PORT,
                MAIL_SERVER=self._settings.SMTP_HOST,
                MAIL_STARTTLS=self._settings.SMTP_TLS,
                MAIL_SSL_TLS=self._settings.SMTP_SSL,
                USE_CREDENTIALS=bool(self._settings.SMTP_USER),
                VALIDATE_CERTS=True,
            )
        self._jinja_env: Environment = Environment(
            loader=FileSystemLoader(searchpath=Path(self._settings.BASE_DIR, "../email-templates", "build")),
            autoescape=select_autoescape(enabled_extensions=["html", "xml"]),
            enable_async=True,
        )

    async def _render_template(self, template_name: str, context: dict[str, Any]) -> str:
        """
        Asynchronously renders a Jinja2 template into an HTML string.

        :param template_name: Template name
        :param context: Dictionary of arguments for template
        :return: HTML string.
        """
        template: Template = self._jinja_env.get_template(name=template_name)
        return await template.render_async(context)

    async def _send_email(self, email_to: str, subject: str, html_content: str) -> None:
        """
        The main method for sending a mail.

        :param email_to: The email address of the recipient.
        :param subject: The subject of the email.
        :param html_content: The HTML content of the email.
        :return: None
        """
        if not self._is_enabled or not self._mailer_config:
            logger.warning("Email sending is disabled or not configured. The letter has not been sent.")
            return None
        message: MessageSchema = MessageSchema(
            subject=subject, recipients=[email_to], body=html_content, subtype="html"
        )
        fm: FastMail = FastMail(config=self._mailer_config)
        try:
            await fm.send_message(message=message)
            logger.info(f"Email sent to {email_to} with subject '{subject}'")
        except Exception as exc:
            logger.error(f"Failed to send email to {email_to}. Error: {exc}")

    def generate_password_reset_token(self, email: str) -> str:
        """
        Generates a JWT token for password reset.

        :param email: The email address of the user.
        :return: The encoded JWT token as a string.
        """
        delta: timedelta = timedelta(hours=self._settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
        now: datetime = datetime.now(tz=timezone.utc)
        expires: datetime = now + delta
        encoded_jwt: str = jwt.encode(
            payload={"exp": expires.timestamp(), "nbf": now, "sub": email},
            key=self._settings.SECRET_KEY,
            algorithm=self._security_manager.ALGORITHM,
        )
        return encoded_jwt

    def verify_password_reset_token(self, token: str) -> str | None:
        """
        Verifies a password reset JWT token.

        :param token: The JWT token to verify.
        :return: The email address of the user if the token is valid, None otherwise.
        """
        try:
            decoded_token: dict = jwt.decode(
                jwt=token, key=self._settings.SECRET_KEY, algorithms=[self._security_manager.ALGORITHM]
            )
            return str(decoded_token["sub"])
        except InvalidTokenError:
            return None

    async def send_test_email(self, email_to: str) -> None:
        """
        Sends a test email.

        :param email_to: The email address of the recipient.
        :return: None
        """
        subject: str = f"{self._settings.PROJECT_NAME} - Test email"
        html_content: str = await self._render_template(
            template_name="test_email.html",
            context={"project_name": self._settings.PROJECT_NAME, "email": email_to},
        )
        await self._send_email(email_to=email_to, subject=subject, html_content=html_content)

    async def send_reset_password_email(self, email_to: str) -> None:
        """
        Sends a password recovery email to the specified email address.

        :param email_to: The email address of the recipient.
        :return: None
        """
        subject: str = f"{self._settings.PROJECT_NAME} - Password recovery for user {email_to}"
        token: str = self.generate_password_reset_token(email=email_to)
        html_content = await self._render_template(
            template_name="reset_password.html",
            context={
                "project_name": self._settings.PROJECT_NAME,
                "username": email_to,
                "email": email_to,
                "valid_hours": self._settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
                "link": f"{self._settings.FRONTEND_URL}/reset-password?token={token}",
            },
        )
        await self._send_email(email_to=email_to, subject=subject, html_content=html_content)

    async def send_new_account_email(self, email_to: str, username: str, password: str) -> None:
        """
        Sends an email to the new user with their account details.

        :param email_to: Recipient's email address.
        :param username: Username of the new user.
        :param password: Password of the new user.
        :return: None
        """
        subject: str = f"{self._settings.PROJECT_NAME} - New account for user {username}"
        html_content: str = await self._render_template(
            template_name="new_account.html",
            context={
                "project_name": self._settings.PROJECT_NAME,
                "username": username,
                "password": password,
                "email": email_to,
                "link": self._settings.FRONTEND_URL,
            },
        )
        await self._send_email(email_to=email_to, subject=subject, html_content=html_content)


@lru_cache(maxsize=1)
def get_email_manager() -> EmailManager:
    """
    Gets the EmailManager object. The lru_cache decorator ensures this function is only called once.

    :return: An instance of EmailManager.
    """
    return EmailManager(settings=get_settings(), security_manager=get_security_manager())
