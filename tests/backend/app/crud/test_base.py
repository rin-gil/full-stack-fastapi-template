"""Unit tests for backend/src/app/crud/base.py"""

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.base import BaseCRUD

__all__: tuple = ()


@pytest.mark.asyncio
async def test_base_crud_initialization() -> None:
    """
    Test initialization of BaseCRUD class.

    :return: None
    """
    session: AsyncSession = AsyncSession()
    crud: BaseCRUD = BaseCRUD(session=session)
    assert crud._session is session, "Session should be correctly assigned to _session attribute"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "session_input", [AsyncSession(), AsyncSession(bind=None)], ids=["default_session", "session_without_bind"]
)
async def test_base_crud_initialization_with_different_sessions(session_input: AsyncSession) -> None:
    """
    Test initialization of BaseCRUD with different session inputs.

    :param session_input: The AsyncSession instance to test with.
    :return: None
    """
    crud: BaseCRUD = BaseCRUD(session=session_input)
    assert crud._session is session_input, f"Expected session {session_input}, but got {crud._session}"
