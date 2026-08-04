from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.config import Config


def create_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(milliseconds=Config.JWT_EXPIRATION_MS)
    return jwt.encode(
        {"sub": username, "iat": now, "exp": exp},
        Config.JWT_SECRET,
        algorithm="HS256",
    )


def extract_username(token: str) -> str | None:
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
