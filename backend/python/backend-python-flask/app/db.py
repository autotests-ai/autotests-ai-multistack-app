from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import Config


class Base(DeclarativeBase):
    pass


_engine_kwargs: dict = {"pool_pre_ping": True}
if Config.SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
    _engine_kwargs = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def apply_schema() -> None:
    schema_path = Path(__file__).resolve().parent.parent / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")
    # SQLite (unit tests): BIGSERIAL / TIMESTAMPTZ not supported — map to portable types.
    if engine.dialect.name == "sqlite":
        sql = (
            sql.replace("BIGSERIAL", "INTEGER")
            .replace("TIMESTAMPTZ", "TEXT")
            .replace("NOW()", "CURRENT_TIMESTAMP")
        )
    with engine.begin() as conn:
        for statement in _split_statements(sql):
            conn.execute(text(statement))


def _split_statements(sql: str) -> list[str]:
    parts: list[str] = []
    for chunk in sql.split(";"):
        stmt = chunk.strip()
        if stmt:
            parts.append(stmt)
    return parts
