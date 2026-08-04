from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class ItemDto(BaseModel):
    id: int
    name: str
    description: str


class ItemsResponse(BaseModel):
    items: list[ItemDto]
    source: str


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class AuthResponse(BaseModel):
    token: str
    username: str
    redirectUrl: str


class UserProfileResponse(BaseModel):
    username: str


class MessageResponse(BaseModel):
    message: str
