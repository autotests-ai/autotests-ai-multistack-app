from __future__ import annotations

import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.db import SessionLocal
from app.jwt_util import extract_username
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def current_username(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail={"message": "Unauthorized"})
    username = extract_username(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail={"message": "Unauthorized"})
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.username == username))
        if user is None:
            raise HTTPException(status_code=401, detail={"message": "Unauthorized"})
    return username
