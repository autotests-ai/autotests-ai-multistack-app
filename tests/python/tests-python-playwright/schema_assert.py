"""JSON Schema checks for `_contract` shapes (same files as the Java api layer)."""

from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft7Validator

_SCHEMAS = Path(__file__).resolve().parent / "schemas"


def assert_schema(body: object, name: str) -> None:
    schema = json.loads((_SCHEMAS / name).read_text(encoding="utf-8"))
    errors = sorted(Draft7Validator(schema).iter_errors(body), key=lambda e: list(e.path))
    assert not errors, "; ".join(err.message for err in errors)
