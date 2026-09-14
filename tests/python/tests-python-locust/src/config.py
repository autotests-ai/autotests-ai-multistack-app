"""Stand + injection knobs for Locust (Python locustfile).

Seed user matches testdata-user: user1 / password1.
"""
from __future__ import annotations

import os


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
    return _first_non_blank(os.environ.get("LOCUST_PROFILE"), "smoke").lower()


def users() -> int:
    return max(1, _parse_int(_first_non_blank(os.environ.get("LOAD_VUS"), "1"), 1))


def during_seconds() -> int:
    return max(1, _parse_int(_first_non_blank(os.environ.get("LOAD_DURING_SECONDS"), "30"), 30))


def ramp_seconds() -> int:
    return max(1, _parse_int(_first_non_blank(os.environ.get("LOAD_RAMP_SECONDS"), "10"), 10))


def allow_public() -> bool:
    return _first_non_blank(os.environ.get("LOCUST_ALLOW_PUBLIC"), "false").lower() == "true"


def json_headers() -> dict[str, str]:
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "tests-python-locust",
    }


def refuse_shared_prod(base_url: str) -> None:
    lower = base_url.lower()
    shared = "autotests.ai" in lower or "qa.guru" in lower
    if shared and not allow_public():
        raise SystemExit(
            f"Refusing {base_url} — isolated SUT only. "
            "Pass LOCUST_ALLOW_PUBLIC=true when the host is a dedicated load stand."
        )
