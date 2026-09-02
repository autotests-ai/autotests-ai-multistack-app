"""Config loader — STAND / BASE_URL / API_BASE_URL, HTTP-only (no browser).

Java ConfigReader analog: stored baseUrl has no trailing slash; resolve* adds it.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
if not os.environ.get("CI"):
    load_dotenv(_ROOT / ".env")

# Same stands as java `src/test/resources/config/{prod,stage,mock,ci}.properties`.
# Owner-file shape: baseUrl has no trailing slash; apiBaseUrl may.
_STANDS: dict[str, dict[str, str]] = {
    "prod": {
        "base_url": "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react",
        "api_base_url": "https://autotests.ai/stack/backend-java-spring/",
    },
    "stage": {
        "base_url": "https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react",
        "api_base_url": "https://stage.autotests.ai/stack/backend-java-spring/",
    },
    "mock": {
        "base_url": "http://localhost:9911",
        "api_base_url": "http://localhost:9911/",
    },
    "ci": {
        "base_url": "http://localhost:9821",
        "api_base_url": "http://localhost:8800/",
    },
}


def _first_non_empty(*values: str) -> str:
    return next(value for value in values if value.strip())


def _with_slash(url: str) -> str:
    return url if url.endswith("/") else f"{url}/"


def resolve_stand() -> str:
    raw = (os.environ.get("STAND") or os.environ.get("ENV") or "prod").strip().lower()
    return raw if raw in _STANDS else "prod"


@dataclass(frozen=True)
class TestConfig:
    __test__ = False
    stand: str
    base_url: str
    api_base_url: str
    api_health_service: str


@dataclass(frozen=True)
class ConfigReader:
    """Closed helper — Java ConfigReader analog."""


def closed_config_reader() -> ConfigReader:
    return ConfigReader()


def load_config() -> TestConfig:
    stand = resolve_stand()
    defaults = _STANDS[stand]
    return TestConfig(
        stand=stand,
        base_url=_first_non_empty(os.environ.get("BASE_URL", ""), defaults["base_url"]),
        api_base_url=_first_non_empty(os.environ.get("API_BASE_URL", ""), defaults["api_base_url"]),
        api_health_service=os.environ.get("API_HEALTH_SERVICE") or "backend-java-spring",
    )


def resolve_base_url(config: TestConfig) -> str:
    url = config.base_url.strip()
    if not url:
        raise ValueError("Set baseUrl in config/${env}.properties")
    return _with_slash(url)


def resolve_api_base_url(config: TestConfig) -> str:
    url = config.api_base_url.strip()
    if not url:
        raise ValueError("Set apiBaseUrl in config/${env}.properties")
    return _with_slash(url)
