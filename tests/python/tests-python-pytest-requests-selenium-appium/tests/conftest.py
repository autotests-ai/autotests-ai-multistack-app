"""Throwaway users with explicit API postconditions — mirrors Java @BeforeEach/@AfterEach."""

from __future__ import annotations

import pytest

from api_client import delete_account_quietly, register
from helpers.user import User, UserBuilder


@pytest.fixture
def new_user(config) -> User:
    """Registered by the test through the UI; deleted afterwards (401 = never created)."""
    user = UserBuilder().with_username().with_password().build()
    yield user
    delete_account_quietly(config, user.username, user.password)


@pytest.fixture
def min_length_user(config) -> User:
    user = UserBuilder().with_min_length_credentials().build()
    yield user
    delete_account_quietly(config, user.username, user.password)


@pytest.fixture
def registered_user(config, new_user: User) -> User:
    """Registered through the API before the test; new_user's teardown deletes it."""
    register(config, new_user.username, new_user.password)
    return new_user
