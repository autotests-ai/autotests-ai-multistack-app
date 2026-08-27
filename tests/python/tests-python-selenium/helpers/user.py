from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class User:
    username: str
    password: str

    def welcome_message(self) -> str:
        return f"Welcome, {self.username}!"


class UserBuilder:
    """Throwaway identity for register / delete-account."""

    def __init__(self) -> None:
        self._username = ""
        self._password = ""

    def with_username(self) -> UserBuilder:
        self._username = f"user_{uuid.uuid4().hex[:10]}"
        return self

    def with_password(self) -> UserBuilder:
        self._password = "password123"
        return self

    def build(self) -> User:
        return User(self._username, self._password)
