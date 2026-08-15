from __future__ import annotations

from api.auth import hash_password
from api.models import Item, User

SEED_ITEMS = (
    ("Alpha", "First seeded item from PostgreSQL"),
    ("Beta", "Second seeded item for demo API"),
    ("Gamma", "Third item — multistack bootstrap"),
)

SEED_USERNAME = "user1"
SEED_PASSWORD = "password1"


def seed_data() -> None:
    if Item.objects.count() == 0:
        Item.objects.bulk_create(
            [Item(name=name, description=description) for name, description in SEED_ITEMS]
        )
    if not User.objects.filter(username=SEED_USERNAME).exists():
        User.objects.create(
            username=SEED_USERNAME,
            password_hash=hash_password(SEED_PASSWORD),
        )
