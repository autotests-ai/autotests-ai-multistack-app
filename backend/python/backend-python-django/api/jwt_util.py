from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings


def create_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(milliseconds=settings.JWT_EXPIRATION_MS)
    return jwt.encode(
        {"sub": username, "iat": now, "exp": exp},
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def extract_username(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
