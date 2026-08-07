from __future__ import annotations

import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _field_error(field: str, value, minimum: int, maximum: int) -> str | None:
    if not value or not isinstance(value, str):
        return f"{field} is required"
    if not (minimum <= len(value) <= maximum):
        return f"{field} must be {minimum}-{maximum} characters"
    return None


def validate_credentials(username, password) -> str | None:
    """Every failing field, joined with "; " as the reference bean validation does."""
    errors = [
        error
        for error in (
            _field_error("username", username, 3, 64),
            _field_error("password", password, 6, 128),
        )
        if error is not None
    ]
    return "; ".join(errors) if errors else None
