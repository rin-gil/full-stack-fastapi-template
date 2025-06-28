"""Module for base CRUD operations."""

from sqlmodel.ext.asyncio.session import AsyncSession

__all__: tuple[str] = ("BaseCRUD",)


class BaseCRUD:
    """Base class for CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """
        Initializes the CRUD object.

        :param session: An asynchronous session to perform database operations.
        """
        self._session: AsyncSession = session
