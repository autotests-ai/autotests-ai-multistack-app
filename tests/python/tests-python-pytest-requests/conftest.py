"""Session config + Allure layer from pytest markers (LAYERS.md). No browser."""

from __future__ import annotations

import allure
import pytest

from config import TestConfig, load_config


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


def pytest_runtest_setup(item: pytest.Item) -> None:
    """Allure layer from pytest markers (LAYERS.md)."""
    if item.get_closest_marker("api"):
        allure.dynamic.label("layer", "api")
    elif item.get_closest_marker("infra") or item.get_closest_marker("infra_backend"):
        allure.dynamic.label("layer", "infra")
