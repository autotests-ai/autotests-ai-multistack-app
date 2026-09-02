"""Throwaway register identity — java User / UserBuilder."""

from __future__ import annotations

from dataclasses import dataclass

from api_client import username as random_username


@dataclass(frozen=True)
class User:
    username: str
    password: str

    def welcome_message(self) -> str:
        return f"Welcome, {self.username}!"


class UserBuilder:
    def __init__(self) -> None:
        self._username = random_username()
        self._password = "password123"

    def with_username(self) -> UserBuilder:
        self._username = random_username()
        return self

    def with_password(self) -> UserBuilder:
        return self

    def build(self) -> User:
        return User(self._username, self._password)
