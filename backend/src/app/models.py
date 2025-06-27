"""Data models for the application using Pydantic and SQLModel."""

from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


__all__: tuple[str, ...] = (
    "Item",
    "ItemBase",
    "ItemCreate",
    "ItemPublic",
    "ItemUpdate",
    "ItemsPublic",
    "Message",
    "NewPassword",
    "Token",
    "TokenPayload",
    "UpdatePassword",
    "User",
    "UserBase",
    "UserCreate",
    "UserPublic",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UsersPublic",
)


# Shared properties
class UserBase(SQLModel):
    """
    General properties shared among all user models.

    :param email: Email address of the user.
    :param is_active: Whether the user is active or not.
    :param is_superuser: Whether the user is a superuser or not.
    :param full_name: Full name of the user (optional).
    """

    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    """
    Model for creating a new user via API

    :param password: Password of the user.
    """

    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    """
    Model for registering a new user.

    :param email: Email address of the user.
    :param password: Password of the user.
    :param full_name: Full name of the user (optional).
    """

    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    """
    Model for updating user data.

    :param email: Email address of the user (optional).
    :param password: Password of the user (optional).
    """

    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    """
    Model for updating the current user's data.

    :param full_name: Full name of the user (optional).
    :param email: Email address of the user (optional).
    """

    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    """
    Model for updating user passwords.

    :param current_password: Current password of the user.
    :param new_password: New password of the user.
    """

    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    """
    The 'user' table model in the database.

    :param id: UUID of the user.
    :param hashed_password: Hashed password of the user.
    :param items: List of items owned by the user.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    """
    Public user model returned via API (without password hash).

    :param id: UUID of the user.
    """

    id: UUID


class UsersPublic(SQLModel):
    """
    A model for returning a list of users with pagination.

    :param data: List of users.
    :param count: Total number of users.
    """

    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    """
    General properties shared by all models of a product.

    :param title: Title of the product.
    :param description: Description of the product (optional).
    """

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    """A model for creating a new product via API."""


# Properties to receive on item update
class ItemUpdate(ItemBase):
    """
    Model for updating product data.

    :param title: Title of the product (optional).
    """

    title: str | None = Field(default=None, min_length=1, max_length=255)


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    """
    The 'item' table model in the database.

    :param id: UUID of the product.
    :param owner_id: UUID of the user who owns the product.
    :param owner: User who owns the product.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="user.id", nullable=False)
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    """
    Public model of a product returned via API.

    :param id: UUID of the product.
    :param owner_id: UUID of the user who owns the product.
    """

    id: UUID
    owner_id: UUID


class ItemsPublic(SQLModel):
    """
    A model for returning a list of items with pagination.

    :param data: List of items.
    :param count: Total number of items.
    """

    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    """
    A model for sending simple text messages.

    :param message: Text message.
    """

    message: str


# JSON payload containing access token
class Token(SQLModel):
    """
    Response model with JWT access token.

    :param access_token: JWT access token.
    :param token_type: Type of token.
    """

    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    """
    The content (payload) of a JWT token.

    :param sub: Subject of the token.
    """

    sub: str | None = None


class NewPassword(SQLModel):
    """
    A model for setting a new password using a reset token.

    :param token: Reset token.
    :param new_password: New password.
    """

    token: str
    new_password: str = Field(min_length=8, max_length=40)
