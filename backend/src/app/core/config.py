"""Configuration for the application."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal
from urllib.parse import quote_plus
from warnings import warn

from pydantic import AnyUrl, BeforeValidator, EmailStr, computed_field, model_validator
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self

__all__: tuple[str, ...] = ("Settings", "get_settings")


class Settings(BaseSettings):
    """Class for application settings."""

    # Common parameters
    PROJECT_NAME: str
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    model_config = SettingsConfigDict(env_file=Path(BASE_DIR, ".env"), env_ignore_empty=True, extra="ignore")
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    # Secrets
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 60 minutes * 24 hours * 8 days = 8 days

    # Admin user
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str

    # CORS
    @staticmethod
    def _parse_cors(v: list[str] | str) -> list[str] | str:
        """
        Helper to parse a comma-separated string into a list of strings.

        :param v: List of strings or comma-separated string.
        :return: List of strings or original value.
        :raises ValueError: If the value is not a list or comma-separated string.
        """
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        if isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        """
        Constructs a list of all CORS origins, including backend and frontend hosts.

        :return: A list of strings representing the origins allowed for CORS.
        """
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [self.FRONTEND_HOST]

    API_V1_STR: str = "/api/v1"
    FRONTEND_HOST: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(_parse_cors)] = []

    # Postgres database
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_SOCKET: str | None = None
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    @computed_field
    @property
    def sqlalchemy_database_uri(self) -> str:
        """
        Constructs the SQLAlchemy database URI.

        :return: String representation of the database URI.
        """
        params: dict[str, str | int] = {
            "scheme": "postgresql+asyncpg",
            "username": self.POSTGRES_USER,
            "password": self.POSTGRES_PASSWORD,
            "path": self.POSTGRES_DB,
        }
        if self.ENVIRONMENT == "production" and self.POSTGRES_SOCKET:
            params["query"] = f"host={quote_plus(self.POSTGRES_SOCKET)}"
        else:
            params["host"] = self.POSTGRES_SERVER
            params["port"] = self.POSTGRES_PORT
        return str(MultiHostUrl.build(**params))

    # Email
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: EmailStr | None = None
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEST_USER: EmailStr = "test@example.com"

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        """
        Sets default value for EMAILS_FROM_NAME if it is not set.

        :return: The instance of the model.
        """
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    @computed_field
    @property
    def emails_enabled(self) -> bool:
        """
        Checks if email sending is enabled.

        :return: True if email sending is enabled, False otherwise.
        """
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    # Security checks
    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        """
        Checks if the given secret value is set to the default placeholder 'changethis'.

        :param var_name: The name of the variable being checked.
        :param value: The value of the secret to be checked.
        :return: None
        :raises ValueError: If the value is set to the default placeholder and the environment is not 'local'.
        """
        if value == "changethis":
            message: str = f"The value of {var_name} is 'changethis', for security, please change it."
            if self.ENVIRONMENT == "local":
                warn(message=message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        """
        Checks if the default secret values are set to the default placeholders in the local environment.

        :return: The instance of the model.
        """
        self._check_default_secret(var_name="SECRET_KEY", value=self.SECRET_KEY)
        self._check_default_secret(var_name="POSTGRES_PASSWORD", value=self.POSTGRES_PASSWORD)
        self._check_default_secret(var_name="FIRST_SUPERUSER_PASSWORD", value=self.FIRST_SUPERUSER_PASSWORD)
        return self


@lru_cache
def get_settings() -> Settings:
    """
    Returns the settings object. The lru_cache decorator ensures this function is only called once.

    :return: Settings object.
    """
    return Settings()
