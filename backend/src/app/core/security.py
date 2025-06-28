"""Provides security-related services for the application, such as password hashing and JWT token creation."""

from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import Settings, get_settings

__all__: tuple[str, ...] = ("SecurityManager", "get_security_manager")


class SecurityManager:
    """Manages security operations like password hashing and JWT token handling."""

    def __init__(self, settings: Settings = get_settings()):
        """
        Initializes the security manager with necessary dependencies.

        :param settings: The application settings object.
        """
        self._settings: Settings = settings
        self._pwd_context: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.ALGORITHM: str = "HS256"

    def create_access_token(self, subject: str | Any, expires_delta: timedelta) -> str:
        """
        Creates a new JWT access token.

        :param subject: The subject of the token (e.g., user ID or email).
        :param expires_delta: The lifespan of the token.
        :return: The encoded JWT token as a string.
        """
        expire: datetime = datetime.now(tz=timezone.utc) + expires_delta
        to_encode: dict[str, Any] = {"exp": expire, "sub": str(subject)}
        encoded_jwt: str = jwt.encode(payload=to_encode, key=self._settings.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verifies a plain password against its hashed version.

        :param plain_password: The plain text password.
        :param hashed_password: The hashed password from the database.
        :return: True if the password is correct, False otherwise.
        """
        return self._pwd_context.verify(secret=plain_password, hash=hashed_password)

    def get_password_hash(self, password: str) -> str:
        """
        Hashes a plain password.

        :param password: The plain text password to hash.
        :return: The hashed password as a string.
        """
        return self._pwd_context.hash(secret=password)


@lru_cache
def get_security_manager() -> SecurityManager:
    """
    Gets the SecurityManager object. The lru_cache decorator ensures this function is only called once.

    :return: An instance of SecurityManager.
    """
    return SecurityManager(settings=get_settings())
