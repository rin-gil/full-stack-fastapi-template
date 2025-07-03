"""Unit tests for backend/src/app/models.py"""

from uuid import UUID, uuid4

import pytest

from app.models import (
    Item,
    ItemBase,
    ItemCreate,
    ItemPublic,
    ItemUpdate,
    ItemsPublic,
    Message,
    NewPassword,
    Token,
    TokenPayload,
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UsersPublic,
)

__all__: tuple = ()


@pytest.mark.parametrize(
    "email,is_active,is_superuser,full_name,is_valid",
    [
        ("test@example.com", True, False, None, True),
        ("invalid_email", True, False, "Test User", False),
        ("test@example.com", False, True, "Test User", True),
        ("test@example.com", True, False, "x" * 256, False),
    ],
    ids=["valid", "invalid_email", "superuser", "long_full_name"],
)
def test_user_base(email: str, is_active: bool, is_superuser: bool, full_name: str | None, is_valid: bool) -> None:
    """
    Test the UserBase model validation.

    :param email: Email address to test.
    :param is_active: Whether the user is active.
    :param is_superuser: Whether the user is a superuser.
    :param full_name: Full name of the user.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        user: UserBase = UserBase(email=email, is_active=is_active, is_superuser=is_superuser, full_name=full_name)
        assert user.email == email
        assert user.is_active == is_active
        assert user.is_superuser == is_superuser
        assert user.full_name == full_name
    else:
        with pytest.raises(expected_exception=ValueError):
            UserBase(email=email, is_active=is_active, is_superuser=is_superuser, full_name=full_name)


@pytest.mark.parametrize(
    "email,password,is_valid",
    [
        ("test@example.com", "validpass123", True),
        ("test@example.com", "short", False),
        ("test@example.com", "x" * 41, False),
        ("invalid_email", "validpass123", False),
    ],
    ids=["valid", "short_password", "long_password", "invalid_email"],
)
def test_user_create(email: str, password: str, is_valid: bool) -> None:
    """
    Test the UserCreate model validation.

    :param email: Email address to test.
    :param password: Password to test.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        user: UserCreate = UserCreate(email=email, password=password)
        assert user.email == email
        assert user.password == password
        assert user.is_active is True
        assert user.is_superuser is False
    else:
        with pytest.raises(expected_exception=ValueError):
            UserCreate(email=email, password=password)


@pytest.mark.parametrize(
    "email,password,full_name,is_valid",
    [
        ("test@example.com", "validpass123", None, True),
        ("invalid_email", "validpass123", "Test User", False),
        ("test@example.com", "short", None, False),
        ("test@example.com", "validpass123", "x" * 256, False),
    ],
    ids=["valid", "invalid_email", "short_password", "long_full_name"],
)
def test_user_register(email: str, password: str, full_name: str | None, is_valid: bool) -> None:
    """
    Test the UserRegister model validation.

    :param email: Email address to test.
    :param password: Password to test.
    :param full_name: Full name of the user.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        user: UserRegister = UserRegister(email=email, password=password, full_name=full_name)
        assert user.email == email
        assert user.password == password
        assert user.full_name == full_name
    else:
        with pytest.raises(expected_exception=ValueError):
            UserRegister(email=email, password=password, full_name=full_name)


@pytest.mark.parametrize(
    "email,password,is_active,is_superuser,full_name,is_valid",
    [
        (None, None, True, False, None, True),
        ("test@example.com", "validpass123", False, True, "Test User", True),
        ("invalid_email", None, True, False, None, False),
        (None, "short", True, False, None, False),
    ],
    ids=["all_none", "full_update", "invalid_email", "short_password"],
)
def test_user_update(
    email: str | None, password: str | None, is_active: bool, is_superuser: bool, full_name: str | None, is_valid: bool
) -> None:
    """
    Test the UserUpdate model validation.

    :param email: Email address to test.
    :param password: Password to test.
    :param is_active: Whether the user is active.
    :param is_superuser: Whether the user is a superuser.
    :param full_name: Full name of the user.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        user: UserUpdate = UserUpdate(
            email=email, password=password, is_active=is_active, is_superuser=is_superuser, full_name=full_name
        )
        assert user.email == email
        assert user.password == password
        assert user.is_active == is_active
        assert user.is_superuser == is_superuser
        assert user.full_name == full_name
    else:
        with pytest.raises(expected_exception=ValueError):
            UserUpdate(
                email=email, password=password, is_active=is_active, is_superuser=is_superuser, full_name=full_name
            )


@pytest.mark.parametrize(
    "full_name,email,is_valid",
    [
        (None, None, True),
        ("Test User", "test@example.com", True),
        ("x" * 256, "test@example.com", False),
        (None, "invalid_email", False),
    ],
    ids=["all_none", "valid_update", "long_full_name", "invalid_email"],
)
def test_user_update_me(full_name: str | None, email: str | None, is_valid: bool) -> None:
    """
    Test the UserUpdateMe model validation.

    :param full_name: Full name of the user.
    :param email: Email address to test.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        user: UserUpdateMe = UserUpdateMe(full_name=full_name, email=email)
        assert user.full_name == full_name
        assert user.email == email
    else:
        with pytest.raises(expected_exception=ValueError):
            UserUpdateMe(full_name=full_name, email=email)


@pytest.mark.parametrize(
    "current_password,new_password,is_valid",
    [("validpass123", "newpass123", True), ("short", "newpass123", False), ("validpass123", "x" * 41, False)],
    ids=["valid", "short_current_password", "long_new_password"],
)
def test_update_password(current_password: str, new_password: str, is_valid: bool) -> None:
    """
    Test the UpdatePassword model validation.

    :param current_password: Current password to test.
    :param new_password: New password to test.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        pwd: UpdatePassword = UpdatePassword(current_password=current_password, new_password=new_password)
        assert pwd.current_password == current_password
        assert pwd.new_password == new_password
    else:
        with pytest.raises(expected_exception=ValueError):
            UpdatePassword(current_password=current_password, new_password=new_password)


def test_user() -> None:
    """
    Test the User database model.

    :return: None
    """
    user_id: UUID = uuid4()
    user: User = User(
        id=user_id,
        email="test@example.com",
        hashed_password="hashed_pass",
        is_active=True,
        is_superuser=False,
        full_name="Test User",
    )
    assert user.id == user_id
    assert user.email == "test@example.com"
    assert user.hashed_password == "hashed_pass"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.full_name == "Test User"
    assert user.items == []


def test_user_public() -> None:
    """
    Test the UserPublic model.

    :return: None
    """
    user_id: UUID = uuid4()
    user: UserPublic = UserPublic(
        id=user_id, email="test@example.com", is_active=True, is_superuser=False, full_name="Test User"
    )
    assert user.id == user_id
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.full_name == "Test User"


def test_users_public() -> None:
    """
    Test the UsersPublic model.

    :return: None
    """
    user: UserPublic = UserPublic(
        id=uuid4(), email="test@example.com", is_active=True, is_superuser=False, full_name="Test User"
    )
    users: UsersPublic = UsersPublic(data=[user], count=1)
    assert users.data == [user]
    assert users.count == 1


@pytest.mark.parametrize(
    "title,description,is_valid",
    [("Test Item", None, True), ("Test Item", "Test Description", True), ("", None, False), ("x" * 256, None, False)],
    ids=["valid_no_desc", "valid_with_desc", "empty_title", "long_title"],
)
def test_item_base(title: str, description: str | None, is_valid: bool) -> None:
    """
    Test the ItemBase model validation.

    :param title: Title of the item.
    :param description: Description of the item.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        item: ItemBase = ItemBase(title=title, description=description)
        assert item.title == title
        assert item.description == description
    else:
        with pytest.raises(expected_exception=ValueError):
            ItemBase(title=title, description=description)


def test_item_create() -> None:
    """
    Test the ItemCreate model.

    :return: None
    """
    item: ItemCreate = ItemCreate(title="Test Item", description="Test Description")
    assert item.title == "Test Item"
    assert item.description == "Test Description"


@pytest.mark.parametrize(
    "title,description,is_valid",
    [(None, None, True), ("Test Item", "Test Description", True), ("", None, False), ("x" * 256, None, False)],
    ids=["all_none", "valid_update", "empty_title", "long_title"],
)
def test_item_update(title: str | None, description: str | None, is_valid: bool) -> None:
    """
    Test the ItemUpdate model validation.

    :param title: Title of the item.
    :param description: Description of the item.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        item: ItemUpdate = ItemUpdate(title=title, description=description)
        assert item.title == title
        assert item.description == description
    else:
        with pytest.raises(expected_exception=ValueError):
            ItemUpdate(title=title, description=description)


def test_item() -> None:
    """
    Test the Item database model.

    :return: None
    """
    item_id: UUID = uuid4()
    owner_id: UUID = uuid4()
    item: Item = Item(id=item_id, title="Test Item", description="Test Description", owner_id=owner_id)
    assert item.id == item_id
    assert item.title == "Test Item"
    assert item.description == "Test Description"
    assert item.owner_id == owner_id
    assert item.owner is None


def test_item_public() -> None:
    """
    Test the ItemPublic model.

    :return: None
    """
    item_id: UUID = uuid4()
    owner_id: UUID = uuid4()
    item: ItemPublic = ItemPublic(id=item_id, title="Test Item", description="Test Description", owner_id=owner_id)
    assert item.id == item_id
    assert item.title == "Test Item"
    assert item.description == "Test Description"
    assert item.owner_id == owner_id


def test_items_public() -> None:
    """
    Test the ItemsPublic model.

    :return: None
    """
    item: ItemPublic = ItemPublic(id=uuid4(), title="Test Item", description="Test Description", owner_id=uuid4())
    items: ItemsPublic = ItemsPublic(data=[item], count=1)
    assert items.data == [item]
    assert items.count == 1


def test_message() -> None:
    """
    Test the Message model.

    :return: None
    """
    message: Message = Message(message="Test message")
    assert message.message == "Test message"


def test_token() -> None:
    """
    Test the Token model.

    :return: None
    """
    token: Token = Token(access_token="test_token", token_type="bearer")
    assert token.access_token == "test_token"
    assert token.token_type == "bearer"


def test_token_payload() -> None:
    """
    Test the TokenPayload model.

    :return: None
    """
    payload: TokenPayload = TokenPayload(sub="test_sub")
    assert payload.sub == "test_sub"
    payload_empty: TokenPayload = TokenPayload(sub=None)
    assert payload_empty.sub is None


@pytest.mark.parametrize(
    "token,new_password,is_valid",
    [("test_token", "newpass123", True), ("test_token", "short", False), ("test_token", "x" * 41, False)],
    ids=["valid", "short_password", "long_password"],
)
def test_new_password(token: str, new_password: str, is_valid: bool) -> None:
    """
    Test the NewPassword model validation.

    :param token: Reset token to test.
    :param new_password: New password to test.
    :param is_valid: Whether the input is expected to be valid.
    :return: None
    """
    if is_valid:
        pwd: NewPassword = NewPassword(token=token, new_password=new_password)
        assert pwd.token == token
        assert pwd.new_password == new_password
    else:
        with pytest.raises(expected_exception=ValueError):
            NewPassword(token=token, new_password=new_password)
