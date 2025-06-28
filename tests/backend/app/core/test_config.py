"""Unit tests for backend/src/app/core/config.py"""

from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings

__all__: tuple = ()

BASE_ENV_FILE_CONTENT: str = """
    PROJECT_NAME=TestProject
    SECRET_KEY=test_secret_key
    FIRST_SUPERUSER=admin@example.com
    FIRST_SUPERUSER_PASSWORD=secure_password
    POSTGRES_SERVER=localhost
    POSTGRES_USER=test_user
    POSTGRES_PASSWORD=secure_password
    POSTGRES_DB=test_db
    POSTGRES_SOCKET=
    SMTP_HOST=
    EMAILS_FROM_EMAIL=
"""


@pytest.fixture
def mock_env_file_path(tmp_path: Path) -> Path:
    """
    Fixture to create a temporary .env file for testing.

    :param tmp_path: Temporary directory provided by pytest.
    :return: Path to the created temporary .env file.
    """
    env_path: Path = Path(tmp_path, ".env")
    env_path.write_text(BASE_ENV_FILE_CONTENT, encoding="utf-8")
    return env_path


@pytest.fixture(autouse=True)
def clear_lru_cache() -> None:
    """
    Clears the lru_cache for get_settings before each test.

    :return: None
    """
    get_settings.cache_clear()


def create_custom_env_file(tmp_path: Path, overrides: dict[str, Any]) -> Path:
    """
    Helper function to create a custom .env file for specific test cases.

    :param tmp_path: Temporary directory provided by pytest.
    :param overrides: A dictionary of values to override in the base .env content.
    :return: Path to the created custom .env file.
    """
    lines: list[str] = BASE_ENV_FILE_CONTENT.strip().split("\n")
    env_data: dict = dict(line.split(sep="=", maxsplit=1) for line in lines if line and "=" in line)
    env_data.update(overrides)
    # Use quotation marks for correct processing of strings that may be lists.
    custom_env_content: str = "\n".join(f'{key}="{value}"' for key, value in env_data.items())
    custom_env_path: Path = Path(tmp_path, ".env")
    custom_env_path.write_text(data=custom_env_content, encoding="utf-8")
    return custom_env_path


@pytest.mark.parametrize(
    argnames="cors_input,expected_output,expected_exception",
    argvalues=[
        ("http://example.com,http://test.com", ["http://example.com", "http://test.com"], None),
        (["http://example.com", "http://test.com"], ["http://example.com", "http://test.com"], None),
        (123, None, ValueError),
        ({"a": "b"}, None, ValueError),
    ],
    ids=["comma_separated_str", "list_of_str", "invalid_int", "invalid_dict"],
)
def test_parse_cors_all_cases(
    cors_input: Any, expected_output: list[str] | None, expected_exception: type[Exception] | None
) -> None:
    """
    Tests the _parse_cors static method for both valid and invalid inputs.

    :param cors_input: Input value for CORS origins.
    :param expected_output: The expected list of strings if input is valid.
    :param expected_exception: The expected exception type if input is invalid.
    :return: None
    """
    if expected_exception:
        with pytest.raises(expected_exception=expected_exception):
            Settings._parse_cors(v=cors_input)
    else:
        result: list[str] = Settings._parse_cors(v=cors_input)
        assert result == expected_output


def test_all_cors_origins(tmp_path: Path) -> None:
    """
    Tests the all_cors_origins computed field.

    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    env_path: Path = create_custom_env_file(
        tmp_path=tmp_path,
        overrides={
            "BACKEND_CORS_ORIGINS": "http://localhost,http://127.0.0.1:8000",
            "FRONTEND_HOST": "http://test-frontend.com",
        },
    )
    settings: Settings = Settings(_env_file=env_path)
    expected: list[str] = ["http://localhost", "http://127.0.0.1:8000", "http://test-frontend.com"]
    assert set(settings.all_cors_origins) == set(expected)


@pytest.mark.parametrize(
    "smtp_host, from_email, expected_enabled",
    [
        ("smtp.example.com", "noreply@example.com", True),
        ("", "noreply@example.com", False),
        ("smtp.example.com", "", False),
        ("", "", False),
    ],
)
def test_emails_enabled(smtp_host: str, from_email: str, expected_enabled: bool, tmp_path: Path) -> None:
    """
    Checks if email sending is enabled.

    :param smtp_host: SMTP host value.
    :param from_email: Email address for sending emails.
    :param expected_enabled: Expected value of emails_enabled.
    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    env_path: Path = create_custom_env_file(
        tmp_path=tmp_path, overrides={"SMTP_HOST": smtp_host, "EMAILS_FROM_EMAIL": from_email}
    )
    settings: Settings = Settings(_env_file=env_path)
    assert settings.emails_enabled is expected_enabled


@pytest.mark.parametrize(
    "environment, secret_value, should_raise",
    [("production", "changethis", True), ("local", "changethis", False), ("production", "secure_value", False)],
)
def test_check_default_secret(environment: str, secret_value: str, should_raise: bool, tmp_path: Path) -> None:
    """
    Checks if the given secret value is set to the default placeholder 'changethis'.

    :param environment: The environment value to set.
    :param secret_value: The secret value to check.
    :param should_raise: Whether an exception should be raised.
    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    env_path: Path = create_custom_env_file(
        tmp_path=tmp_path, overrides={"ENVIRONMENT": environment, "SECRET_KEY": secret_value}
    )
    if should_raise:
        # This block checks that ValueError is actually raised.
        with pytest.raises(expected_exception=ValueError, match="is 'changethis'"):
            Settings(_env_file=env_path)
    else:
        # Warning expected (local + 'changethis')
        if secret_value == "changethis":
            with pytest.warns(expected_warning=UserWarning, match="is 'changethis'"):
                settings: Settings = Settings(_env_file=env_path)
            assert settings.SECRET_KEY == "changethis"
        # No errors or warnings are expected (any environment + 'secure_value')
        else:
            settings = Settings(_env_file=env_path)
            assert settings.SECRET_KEY == secret_value


def test_get_settings_caching(tmp_path: Path) -> None:
    """
    Returns the settings object. The lru_cache decorator ensures this function is only called once.

    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    env_path: Path = create_custom_env_file(tmp_path=tmp_path, overrides={})
    original_env_file: Path = Settings.model_config.get("env_file")
    Settings.model_config["env_file"] = env_path
    try:
        settings1: Settings = get_settings()
        settings2: Settings = get_settings()
        assert settings1 is settings2
    finally:
        get_settings.cache_clear()
        Settings.model_config["env_file"] = original_env_file


def test_settings_reads_from_mock_env_file(mock_env_file_path: Path) -> None:
    """
    Tests that Settings correctly reads variables from the mocked .env file.

    :param mock_env_file_path: Fixture providing the path to the temporary .env file.
    :return: None
    """
    settings: Settings = Settings(_env_file=mock_env_file_path)
    assert settings.PROJECT_NAME == "TestProject"
    assert settings.SECRET_KEY == "test_secret_key"
    assert settings.FIRST_SUPERUSER == "admin@example.com"
    assert settings.POSTGRES_USER == "test_user"


def test_missing_required_env_vars(tmp_path: Path) -> None:
    """
    Tests behavior when required environment variables are missing from the .env file.

    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    empty_env_path: Path = Path(tmp_path, ".env")
    empty_env_path.write_text(data="", encoding="utf-8")
    with pytest.raises(expected_exception=ValidationError):
        Settings(_env_file=empty_env_path)


@pytest.mark.parametrize(
    argnames="overrides, expected_uri",
    argvalues=[
        (
            {"POSTGRES_PASSWORD": "secure_password"},
            "postgresql+asyncpg://test_user:secure_password@localhost:5432/test_db",
        ),
        (
            {"ENVIRONMENT": "production", "POSTGRES_SOCKET": "/var/run/postgresql"},
            "postgresql+asyncpg://test_user:secure_password@/test_db?host=%2Fvar%2Frun%2Fpostgresql",
        ),
        ({"POSTGRES_PASSWORD": ""}, "postgresql+asyncpg://test_user@localhost:5432/test_db"),
    ],
    ids=["tcp_with_password", "production_with_socket", "tcp_no_password"],
)
def test_sqlalchemy_database_uri(overrides: dict[str, str], expected_uri: str, tmp_path: Path) -> None:
    """
    Tests the sqlalchemy_database_uri computed field with different configurations.

    :param overrides: A dictionary of values to override in the base .env content.
    :param expected_uri: The expected database URI string.
    :param tmp_path: Temporary directory provided by pytest.
    :return: None
    """
    custom_env_path: Path = create_custom_env_file(tmp_path=tmp_path, overrides=overrides)
    settings: Settings = Settings(_env_file=custom_env_path)
    assert settings.sqlalchemy_database_uri == expected_uri
