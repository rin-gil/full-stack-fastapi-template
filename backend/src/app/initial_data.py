"""Module for creating initial database schema and data."""

from asyncio import run

# noinspection PyProtectedMember
from loguru._logger import Logger
from sqlmodel import SQLModel

from app.core.config import get_settings, Settings
from app.core.db import get_db_manager, DatabaseManager
from app.core.log_setup import get_logger
from app.crud.user import UserCRUD
from app.models import UserCreate, User

__all__: tuple = ()

logger: Logger = get_logger()


class InitialDataGenerator:
    """Handles the creation of initial database schema and data."""

    def __init__(self, db_manager: DatabaseManager, settings: Settings) -> None:
        """
        Initializes the initial data generator.

        :param db_manager: The database manager to use for creating tables and sessions.
        :param settings: The application settings object.
        """
        self._db_manager: DatabaseManager = db_manager
        self._settings: Settings = settings

    async def create_tables(self) -> None:
        """
        Creates all database tables based on SQLModel metadata.

        :return: None
        """
        logger.info("Creating tables...")
        async with self._db_manager.engine.begin() as conn:
            await conn.run_sync(fn=SQLModel.metadata.create_all)
        logger.info("Tables created.")

    async def create_first_superuser(self) -> None:
        """
        Creates the first superuser if it doesn't exist.

        :return: None
        """
        logger.info("Creating first superuser...")
        async for session in self._db_manager.get_session():
            user_crud: UserCRUD = UserCRUD(session=session)
            user: User | None = await user_crud.get_by_email(email=self._settings.FIRST_SUPERUSER)
            if not user:
                user_in: UserCreate = UserCreate(
                    email=self._settings.FIRST_SUPERUSER,
                    password=self._settings.FIRST_SUPERUSER_PASSWORD,
                    is_superuser=True,
                )
                await user_crud.create(user_create=user_in)
                logger.info("First superuser created.")
            else:
                logger.info("First superuser already exists. Skipping.")

    async def run(self) -> None:
        """
        Runs the entire data initialization process.

        :return: None
        """
        await self.create_tables()
        await self.create_first_superuser()


async def main() -> None:
    """
    Main function to set up and run the generator.

    :return: None
    """
    settings: Settings = get_settings()
    db_manager: DatabaseManager = get_db_manager()
    generator: InitialDataGenerator = InitialDataGenerator(db_manager=db_manager, settings=settings)
    await generator.run()


if __name__ == "__main__":
    run(main=main())
