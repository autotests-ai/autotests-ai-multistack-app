"""Stand + injection knobs for official tsenart/vegeta (open-loop rps).

Seed user matches testdata-user: user1 / password1.
"""
from __future__ import annotations

import os
from urllib.parse import urlparse


def _first_non_blank(*values: object) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def _parse_int(raw: str, fallback: int) -> int:
    try:
        return int(raw, 10)
    except (TypeError, ValueError):
        return fallback


def strip_trailing_slash(url: str) -> str:
    return url[:-1] if url.endswith("/") else url


def api_base_url() -> str:
    return strip_trailing_slash(
        _first_non_blank(os.environ.get("API_BASE_URL"), os.environ.get("apiBaseUrl"), "http://localhost:8800")
    )


def username() -> str:
    return _first_non_blank(os.environ.get("LOAD_USERNAME"), os.environ.get("username"), "user1")


def password() -> str:
    return _first_non_blank(os.environ.get("LOAD_PASSWORD"), os.environ.get("password"), "password1")


def profile() -> str:
    return _first_non_blank(os.environ.get("VEGETA_PROFILE"), "smoke").lower()


def rate() -> int:
    return max(1, _parse_int(_first_non_blank(os.environ.get("LOAD_VUS"), "1"), 1))


def during_seconds() -> int:
    return max(1, _parse_int(_first_non_blank(os.environ.get("LOAD_DURING_SECONDS"), "30"), 30))


def allow_public() -> bool:
    return _first_non_blank(os.environ.get("VEGETA_ALLOW_PUBLIC"), "false").lower() == "true"


def refuse_shared_prod(base_url: str) -> None:
    lower = base_url.lower()
    shared = "autotests.ai" in lower or "qa.guru" in lower
    if shared and not allow_public():
        raise SystemExit(
            f"Refusing {base_url} — isolated SUT only. "
            "Pass VEGETA_ALLOW_PUBLIC=true when the host is a dedicated load stand."
        )


def split_target(base_url: str) -> tuple[str, int, bool, str]:
    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise SystemExit(f"STOP: API_BASE_URL must be http(s)://host[:port][/prefix], got {base_url}")
    ssl = parsed.scheme == "https"
    port = parsed.port or (443 if ssl else 80)
    prefix = parsed.path.rstrip("/")
    return parsed.hostname, port, ssl, prefix
