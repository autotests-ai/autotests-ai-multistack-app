"""Config loader — STAND / BASE_URL / API_BASE_URL, HTTP-only (no browser)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
if not os.environ.get("CI"):
    load_dotenv(_ROOT / ".env")

# Same stands as java `src/test/resources/config/{prod,stage,mock,ci}.properties`.
_STANDS: dict[str, dict[str, str]] = {
    "prod": {
        "base_url": "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/",
        "api_base_url": "https://autotests.ai/stack/backend-java-spring/",
    },
    "stage": {
        "base_url": "https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/",
        "api_base_url": "https://stage.autotests.ai/stack/backend-java-spring/",
    },
    "mock": {
        "base_url": "http://127.0.0.1:9911/",
        "api_base_url": "http://127.0.0.1:9911/",
    },
    "ci": {
        "base_url": "http://127.0.0.1:9821/",
        "api_base_url": "http://127.0.0.1:8800/",
    },
}


def _slash(url: str) -> str:
    return url.rstrip("/") + "/"


def resolve_stand() -> str:
    raw = (os.environ.get("STAND") or os.environ.get("ENV") or "prod").strip().lower()
    return raw if raw in _STANDS else "prod"


@dataclass(frozen=True)
class TestConfig:
    stand: str
    base_url: str
    api_base_url: str
    api_health_service: str


def load_config() -> TestConfig:
    stand = resolve_stand()
    defaults = _STANDS[stand]
    base = _slash(os.environ.get("BASE_URL", defaults["base_url"]))
    api = _slash(os.environ.get("API_BASE_URL", defaults["api_base_url"]))
    return TestConfig(
        stand=stand,
        base_url=base,
        api_base_url=api,
        api_health_service=os.environ.get("API_HEALTH_SERVICE", "backend-java-spring"),
    )
