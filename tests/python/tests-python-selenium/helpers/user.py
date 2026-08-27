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
    """User data for tests. with_seeded_user() is the stand account; faker-like
    methods are for register / throwaway only.
    """

    def __init__(self) -> None:
        self._username = ""
        self._password = ""

    def with_username(self) -> UserBuilder:
        self._username = f"user_{uuid.uuid4().hex[:10]}"
        return self

    def with_password(self) -> UserBuilder:
        self._password = "password123"
        return self

    def with_seeded_user(self) -> UserBuilder:
        """Seeded demo user on the teaching stack (user1 / password1)."""
        self._username = "user1"
        self._password = "password1"
        return self

    def build(self) -> User:
        return User(self._username, self._password)
