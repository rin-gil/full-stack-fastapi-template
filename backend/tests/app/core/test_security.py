"""Unit tests for backend/src/app/core/security.py"""

# pylint: disable=protected-access
# pylint: disable=redefined-outer-name

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import MagicMock

import pytest
from passlib.context import CryptContext
from pytest_mock import MockerFixture

from app.core.config import Settings
from app.core.security import SecurityManager, get_security_manager

__all__: tuple = ()


@pytest.fixture
def mock_settings(mocker: MockerFixture) -> Settings:
    """
    Mocks the Settings object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked Settings object.
    """
    settings: Settings = mocker.create_autospec(spec=Settings, instance=True)
    settings.SECRET_KEY = "test_secret_key"
    return settings


@pytest.fixture
def mock_crypt_context(mocker: MockerFixture) -> CryptContext:
    """
    Mocks the CryptContext object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked CryptContext object.
    """
    crypt_context: CryptContext = mocker.create_autospec(spec=CryptContext, instance=True)
    return crypt_context


def test_security_manager_init(mock_settings: Settings, mock_crypt_context: Any, mocker: MockerFixture) -> None:
    """
    Tests the initialization of the SecurityManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_crypt_context: Mocked CryptContext object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.security.CryptContext", return_value=mock_crypt_context)
    security_manager: SecurityManager = SecurityManager(settings=mock_settings)
    assert security_manager._settings == mock_settings
    assert security_manager._pwd_context == mock_crypt_context
    assert security_manager.ALGORITHM == "HS256"


@pytest.mark.parametrize(
    argnames="subject,expires_delta",
    argvalues=[
        ("user@example.com", timedelta(minutes=30)),
        (123, timedelta(hours=1)),
        ("test_user", timedelta(days=1)),
    ],
    ids=["email_subject", "int_subject", "string_subject"],
)
def test_create_access_token(
    subject: str | int, expires_delta: timedelta, mock_settings: Settings, mocker: MockerFixture
) -> None:
    """
    Tests the create_access_token method of the SecurityManager class.

    :param subject: The subject of the token (e.g., user ID or email).
    :param expires_delta: The lifespan of the token.
    :param mock_settings: Mocked Settings object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mock_jwt_encode: MagicMock = mocker.patch(target="app.core.security.jwt.encode", return_value="mocked_token")
    security_manager: SecurityManager = SecurityManager(settings=mock_settings)
    token: str = security_manager.create_access_token(subject=subject, expires_delta=expires_delta)
    assert token == "mocked_token"
    mock_jwt_encode.assert_called_once()
    call_args: dict[str, Any] = mock_jwt_encode.call_args.kwargs
    assert call_args["key"] == mock_settings.SECRET_KEY
    assert call_args["algorithm"] == "HS256"
    assert call_args["payload"]["sub"] == str(subject)
    assert isinstance(call_args["payload"]["exp"], datetime)


@pytest.mark.parametrize(
    argnames="plain_password,hashed_password,verify_result",
    argvalues=[
        ("password123", "hashed_password123", True),
        ("wrong_password", "hashed_password123", False),
        ("password123", "different_hash", False),
    ],
    ids=["correct_password", "wrong_password", "different_hash"],
)
def test_verify_password(
    plain_password: str,
    hashed_password: str,
    verify_result: bool,
    mock_settings: Settings,
    mock_crypt_context: Any,
    mocker: MockerFixture,
) -> None:
    """
    Tests the verify_password method of the SecurityManager class.

    :param plain_password: The plain text password.
    :param hashed_password: The hashed password.
    :param verify_result: Expected result of the verification.
    :param mock_settings: Mocked Settings object.
    :param mock_crypt_context: Mocked CryptContext object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.security.CryptContext", return_value=mock_crypt_context)
    mock_crypt_context.verify.return_value = verify_result
    security_manager: SecurityManager = SecurityManager(settings=mock_settings)
    result: bool = security_manager.verify_password(plain_password=plain_password, hashed_password=hashed_password)
    assert result == verify_result
    mock_crypt_context.verify.assert_called_once_with(secret=plain_password, hash=hashed_password)


def test_get_password_hash(mock_settings: Settings, mock_crypt_context: Any, mocker: MockerFixture) -> None:
    """
    Tests the get_password_hash method of the SecurityManager class.

    :param mock_settings: Mocked Settings object.
    :param mock_crypt_context: Mocked CryptContext object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.security.CryptContext", return_value=mock_crypt_context)
    mock_crypt_context.hash.return_value = "hashed_password"
    security_manager: SecurityManager = SecurityManager(settings=mock_settings)
    result: str = security_manager.get_password_hash(password="password123")
    assert result == "hashed_password"
    mock_crypt_context.hash.assert_called_once_with(secret="password123")


def test_get_security_manager_caching(mocker: MockerFixture, mock_settings: Settings) -> None:
    """
    Tests the get_security_manager function caching with lru_cache.

    :param mocker: Pytest-mock fixture for mocking.
    :param mock_settings: Mocked Settings object.
    :return: None
    """
    mocker.patch(target="app.core.security.get_settings", return_value=mock_settings)
    security_manager1: SecurityManager = get_security_manager()
    security_manager2: SecurityManager = get_security_manager()
    assert security_manager1 is security_manager2
