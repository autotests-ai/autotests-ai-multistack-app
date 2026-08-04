from __future__ import annotations

from sqlalchemy import func, select

from app.auth import hash_password
from app.db import SessionLocal
from app.models import Item, User

SEED_ITEMS = (
    ("Alpha", "First seeded item from PostgreSQL"),
    ("Beta", "Second seeded item for demo API"),
    ("Gamma", "Third item — reference-app bootstrap"),
)

SEED_USERNAME = "user1"
SEED_PASSWORD = "password1"


def seed_data() -> None:
    with SessionLocal() as session:
        count = session.scalar(select(func.count()).select_from(Item)) or 0
        if count == 0:
            for name, description in SEED_ITEMS:
                session.add(Item(name=name, description=description))

        exists = session.scalar(select(User).where(User.username == SEED_USERNAME))
        if exists is None:
            session.add(
                User(
                    username=SEED_USERNAME,
                    password_hash=hash_password(SEED_PASSWORD),
                )
            )
        session.commit()
