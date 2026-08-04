from __future__ import annotations

import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def validate_credentials(username, password) -> str | None:
    if not username or not isinstance(username, str):
        return "username is required"
    if not password or not isinstance(password, str):
        return "password is required"
    if not (3 <= len(username) <= 64):
        return "username must be 3-64 characters"
    if not (6 <= len(password) <= 128):
        return "password must be 6-128 characters"
    return None
