from __future__ import annotations

import bcrypt
from flask import g, jsonify, request
from sqlalchemy import select

from app.db import SessionLocal
from app.jwt_util import extract_username
from app.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def validate_credentials(username: str | None, password: str | None) -> str | None:
    if not username or not isinstance(username, str):
        return "username is required"
    if not password or not isinstance(password, str):
        return "password is required"
    if not (3 <= len(username) <= 64):
        return "username must be 3-64 characters"
    if not (6 <= len(password) <= 128):
        return "password must be 6-128 characters"
    return None


def require_auth() -> tuple | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"message": "Unauthorized"}), 401
    username = extract_username(header[7:])
    if not username:
        return jsonify({"message": "Unauthorized"}), 401
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.username == username))
        if user is None:
            return jsonify({"message": "Unauthorized"}), 401
    g.username = username
    return None
