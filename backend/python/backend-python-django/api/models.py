from __future__ import annotations

from django.db import models


class Item(models.Model):
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=512)

    class Meta:
        db_table = "items"


class User(models.Model):
    username = models.CharField(max_length=64, unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["username"], name="idx_users_username"),
        ]
