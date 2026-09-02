"""Shared page objects — mirrors Java TestBase fields."""

from __future__ import annotations

import pytest

from config import TestConfig
from pages.header_component import HeaderComponent
from pages.home_page import HomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage


@pytest.fixture
def login_page(selene_browser, config: TestConfig) -> LoginPage:
    return LoginPage(config)


@pytest.fixture
def register_page(selene_browser, config: TestConfig) -> RegisterPage:
    return RegisterPage(config)


@pytest.fixture
def home_page(selene_browser, config: TestConfig) -> HomePage:
    return HomePage(config)


@pytest.fixture
def header(selene_browser) -> HeaderComponent:
    return HeaderComponent()
