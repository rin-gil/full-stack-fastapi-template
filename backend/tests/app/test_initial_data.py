# type: ignore
"""Unit tests for backend/src/app/initial_data.py"""

# pylint: disable=redefined-outer-name
# pylint: disable=protected-access

from unittest.mock import AsyncMock, MagicMock

import pytest
from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.core.config import Settings
from app.core.db import DatabaseManager
from app.crud.user import UserCRUD

# noinspection PyProtectedMember
from app.initial_data import InitialDataGenerator, main
from app.models import User, UserCreate

__all__: tuple = ()


@pytest.fixture
def mock_settings(mocker: MockerFixture) -> Settings:
    """
    Fixture for mocking Settings.

    :param mocker: Pytest mocker fixture.
    :return: Mocked Settings instance.
    """
    mock_settings: Settings = mocker.Mock(spec=Settings)
    mock_settings.FIRST_SUPERUSER = "admin@example.com"
    mock_settings.FIRST_SUPERUSER_PASSWORD = "adminpassword"
    return mock_settings


# noinspection PyPropertyAccess
@pytest.fixture
def mock_db_manager(mocker: MockerFixture) -> DatabaseManager:
    """
    Fixture for mocking DatabaseManager.

    :param mocker: Pytest mocker fixture.
    :return: Mocked DatabaseManager instance.
    """
    mock_manager: DatabaseManager = mocker.create_autospec(spec=DatabaseManager, instance=True)
    mock_manager.engine = mocker.AsyncMock(spec=AsyncEngine)
    mock_session: AsyncMock = mocker.AsyncMock(spec=AsyncSession)

    async def session_generator_mock() -> AsyncSession:
        """
        Asynchronous generator that yields a mock session.

        :return: Mock session
        """
        yield mock_session

    mock_manager.get_session = session_generator_mock
    mock_manager.mock_session = mock_session
    return mock_manager


@pytest.fixture
def mock_user_crud(mocker: MockerFixture) -> UserCRUD:
    """
    Fixture for mocking UserCRUD.

    :param mocker: Pytest mocker fixture.
    :return: Mocked UserCRUD instance.
    """
    return mocker.Mock(spec=UserCRUD)


@pytest.fixture
def mock_user(mocker: MockerFixture) -> User:
    """
    Fixture for mocking User.

    :param mocker: Pytest mocker fixture.
    :return: Mocked User instance.
    """
    return mocker.Mock(spec=User)


@pytest.fixture
def mock_user_create(mocker: MockerFixture) -> UserCreate:
    """
    Fixture for mocking UserCreate.

    :param mocker: Pytest mocker fixture.
    :return: Mocked UserCreate instance.
    """
    return mocker.Mock(spec=UserCreate)


def test_initial_data_generator_init(mock_db_manager: DatabaseManager, mock_settings: Settings) -> None:
    """
    Test initialization of InitialDataGenerator.

    :param mock_db_manager: Mocked DatabaseManager instance.
    :param mock_settings: Mocked Settings instance.
    :return: None
    """
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=mock_db_manager, settings=mock_settings)
    assert generator._db_manager == mock_db_manager
    assert generator._settings == mock_settings


@pytest.mark.asyncio
async def test_create_tables(mocker: MockerFixture, mock_db_manager: DatabaseManager, mock_settings: Settings) -> None:
    """
    Test asynchronous creation of database tables.

    :param mocker: Pytest mocker fixture.
    :param mock_db_manager: Mocked DatabaseManager instance.
    :param mock_settings: Mocked Settings instance.
    :return: None
    """
    mock_logger: MagicMock = mocker.patch(target="app.initial_data.logger")
    mock_conn: AsyncMock = mocker.AsyncMock()
    mock_db_manager.engine.begin.return_value.__aenter__.return_value = mock_conn
    mock_create_all: MagicMock = mocker.patch(target="sqlmodel.SQLModel.metadata.create_all", return_value=None)
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=mock_db_manager, settings=mock_settings)
    await generator.create_tables()
    mock_logger.info.assert_any_call("Creating tables...")
    mock_db_manager.engine.begin.assert_called_once()
    mock_conn.run_sync.assert_awaited_once_with(fn=mock_create_all)
    mock_logger.info.assert_any_call("Tables created.")


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_create_first_superuser_exists(
    mocker: MockerFixture,
    mock_db_manager: DatabaseManager,
    mock_settings: Settings,
    mock_user_crud: UserCRUD,
    mock_user: User,
) -> None:
    """
    Test asynchronous creation of first superuser when it already exists.

    :param mocker: Pytest mocker fixture.
    :param mock_db_manager: Mocked DatabaseManager instance.
    :param mock_settings: Mocked Settings instance.
    :param mock_user_crud: Mocked UserCRUD instance.
    :param mock_user: Mocked User instance.
    :return: None
    """
    mock_logger: MagicMock = mocker.patch(target="app.initial_data.logger")
    mock_user_crud_class: MagicMock = mocker.patch(target="app.initial_data.UserCRUD", return_value=mock_user_crud)
    mock_user_crud.get_by_email.return_value = mock_user
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=mock_db_manager, settings=mock_settings)
    await generator.create_first_superuser()
    mock_logger.info.assert_any_call("Creating first superuser...")
    mock_user_crud_class.assert_called_once_with(session=mock_db_manager.mock_session)
    mock_user_crud.get_by_email.assert_awaited_once_with(email=mock_settings.FIRST_SUPERUSER)
    mock_logger.info.assert_any_call("First superuser already exists. Skipping.")
    mock_user_crud.create.assert_not_called()


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_create_first_superuser_not_exists(
    mocker: MockerFixture,
    mock_db_manager: DatabaseManager,
    mock_settings: Settings,
    mock_user_crud: UserCRUD,
    mock_user_create: UserCreate,
    mock_user: User,
) -> None:
    """
    Test asynchronous creation of first superuser when it does not exist.

    :param mocker: Pytest mocker fixture.
    :param mock_db_manager: Mocked DatabaseManager instance.
    :param mock_settings: Mocked Settings instance.
    :param mock_user_crud: Mocked UserCRUD instance.
    :param mock_user_create: Mocked UserCreate instance.
    :param mock_user: Mocked User instance.
    :return: None
    """
    mock_logger: MagicMock = mocker.patch(target="app.initial_data.logger")
    mock_user_crud_class: MagicMock = mocker.patch(target="app.initial_data.UserCRUD", return_value=mock_user_crud)
    mock_user_create_class: MagicMock = mocker.patch(
        target="app.initial_data.UserCreate", return_value=mock_user_create
    )
    mock_user_crud.get_by_email.return_value = None
    mock_user_crud.create.return_value = mock_user
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=mock_db_manager, settings=mock_settings)
    await generator.create_first_superuser()
    mock_logger.info.assert_any_call("Creating first superuser...")
    mock_user_crud_class.assert_called_once_with(session=mock_db_manager.mock_session)
    mock_user_crud.get_by_email.assert_awaited_once_with(email=mock_settings.FIRST_SUPERUSER)
    mock_user_create_class.assert_called_once_with(
        email=mock_settings.FIRST_SUPERUSER, password=mock_settings.FIRST_SUPERUSER_PASSWORD, is_superuser=True
    )
    mock_user_crud.create.assert_awaited_once_with(user_create=mock_user_create)
    mock_logger.info.assert_any_call("First superuser created.")


@pytest.mark.asyncio
async def test_run(mocker: MockerFixture, mock_db_manager: DatabaseManager, mock_settings: Settings) -> None:
    """
    Test the run method of InitialDataGenerator.

    :param mocker: Pytest mocker fixture.
    :param mock_db_manager: Mocked DatabaseManager instance.
    :param mock_settings: Mocked Settings instance.
    :return: None
    """
    mock_create_tables: AsyncMock = mocker.patch(
        target="app.initial_data.InitialDataGenerator.create_tables", new_callable=AsyncMock
    )
    mock_create_first_superuser: AsyncMock = mocker.patch(
        target="app.initial_data.InitialDataGenerator.create_first_superuser", new_callable=AsyncMock
    )
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=mock_db_manager, settings=mock_settings)
    await generator.run()
    mock_create_tables.assert_awaited_once()
    mock_create_first_superuser.assert_awaited_once()


# noinspection PyUnresolvedReferences
@pytest.mark.asyncio
async def test_main(mocker: MockerFixture, mock_settings: Settings, mock_db_manager: DatabaseManager) -> None:
    """
    Test the main function for database initialization.

    :param mocker: Pytest mocker fixture.
    :param mock_settings: Mocked Settings instance.
    :param mock_db_manager: Mocked DatabaseManager instance.
    :return: None
    """
    mock_settings_class: MagicMock = mocker.patch(target="app.initial_data.get_settings", return_value=mock_settings)
    mock_db_manager_class: MagicMock = mocker.patch(
        target="app.initial_data.get_db_manager", return_value=mock_db_manager
    )
    mock_generator_class: MagicMock = mocker.patch(
        target="app.initial_data.InitialDataGenerator", return_value=mocker.Mock(spec=InitialDataGenerator)
    )
    mock_generator_instance: InitialDataGenerator = mock_generator_class.return_value
    await main()
    mock_settings_class.assert_called_once()
    mock_db_manager_class.assert_called_once()
    mock_generator_class.assert_called_once_with(db_manager=mock_db_manager, settings=mock_settings)
    mock_generator_instance.run.assert_awaited_once()
