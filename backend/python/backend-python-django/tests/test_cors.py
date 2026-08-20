from __future__ import annotations

import pytest

from api.cors_policy import allowed_origin


@pytest.mark.parametrize(
    ("origin", "host", "expected"),
    [
        (None, "localhost:8000", None),
        ("http://localhost:5173", "example.test", "http://localhost:5173"),
        ("http://127.0.0.1:5174", "example.test", "http://127.0.0.1:5174"),
        ("https://autotests.ai", "autotests.ai", "https://autotests.ai"),
        ("https://autotests.ai", "autotests.ai:443", "https://autotests.ai"),
        ("https://evil.example.com", "autotests.ai", None),
        ("not-a-url", "autotests.ai", None),
        ("https://autotests.ai", None, None),
    ],
)
def test_allowed_origin(origin, host, expected):
    assert allowed_origin(origin, host) == expected
