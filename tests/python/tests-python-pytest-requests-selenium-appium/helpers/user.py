from __future__ import annotations

import random
import string
import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class User:
    username: str
    password: str

    def welcome_message(self) -> str:
        return f"Welcome, {self.username}!"


class UserBuilder:
    """Throwaway identity for register / delete-account (same shape as Java UserBuilder)."""

    def __init__(self) -> None:
        self._username = ""
        self._password = ""

    def with_username(self) -> UserBuilder:
        self._username = "u" + uuid.uuid4().hex[:12]
        return self

    def with_password(self) -> UserBuilder:
        self._password = "password123"
        return self

    def with_min_length_credentials(self) -> UserBuilder:
        """Exactly backend @Size(min=3) login and @Size(min=6) password."""
        self._username = "".join(random.choices(string.ascii_lowercase + string.digits, k=3))
        self._password = "123456"
        return self

    def build(self) -> User:
        return User(self._username, self._password)
