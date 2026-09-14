"""Contract chain against teaching /api: health → login → me → items → logout.

Default injection is 1 user / 1 iteration (local smoke). LOCUST_PROFILE=load
holds N concurrent users (closed model, like Gatling injectClosed / k6 ramping-vus).
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import TextIO

from locust import HttpUser, constant, events, task
from locust.exception import StopTest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import (
    api_base_url,
    json_headers,
    password,
    profile,
    refuse_shared_prod,
    username,
)

_JSONL: TextIO | None = None
_BASE = api_base_url()
refuse_shared_prod(_BASE)


def _results_path() -> Path:
    raw = os.environ.get("LOCUST_JSONL", "").strip()
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parents[1] / "build" / "locust" / "results.json"


def _start_ms(start_time: object) -> int:
    if hasattr(start_time, "timestamp"):
        return int(start_time.timestamp() * 1000)  # type: ignore[union-attr]
    return int(float(start_time or 0) * 1000)


@events.test_start.add_listener
def _open_jsonl(**_kwargs: object) -> None:
    global _JSONL
    path = _results_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    _JSONL = path.open("w", encoding="utf-8")


@events.test_stop.add_listener
def _close_jsonl(**_kwargs: object) -> None:
    global _JSONL
    if _JSONL is not None:
        _JSONL.flush()
        _JSONL.close()
        _JSONL = None


@events.request.add_listener
def _record_request(
    response_time: float,
    exception: object,
    start_time: object,
    **_kwargs: object,
) -> None:
    if _JSONL is None:
        return
    ts = datetime.fromtimestamp(_start_ms(start_time) / 1000, tz=timezone.utc).isoformat()
    row = {
        "kind": "locust",
        "time": ts,
        "elapsed_ms": float(response_time or 0),
        "ok": exception is None,
    }
    _JSONL.write(json.dumps(row, ensure_ascii=False) + "\n")
    _JSONL.flush()


class AuthApiUser(HttpUser):
    wait_time = constant(0)
    host = _BASE

    def on_start(self) -> None:
        self.client.headers.update(json_headers())

    @task
    def auth_api(self) -> None:
        try:
            with self.client.get("/api/health", name="health", catch_response=True) as health:
                body = health.json() if health.content else {}
                if health.status_code != 200 or body.get("status") != "ok":
                    health.failure(f"health {health.status_code} {body}")
                    return
                health.success()

            token = ""
            with self.client.post(
                "/api/auth/login",
                json={"username": username(), "password": password()},
                name="login",
                catch_response=True,
            ) as login:
                body = login.json() if login.content else {}
                token = str(body.get("token") or "")
                if login.status_code != 200 or body.get("username") != username() or not token:
                    login.failure(f"login {login.status_code} {body}")
                    return
                login.success()

            with self.client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"},
                name="me",
                catch_response=True,
            ) as me:
                body = me.json() if me.content else {}
                if me.status_code != 200 or body.get("username") != username():
                    me.failure(f"me {me.status_code} {body}")
                    return
                me.success()

            with self.client.get("/api/items", name="items", catch_response=True) as items:
                body = items.json() if items.content else {}
                first = (body.get("items") or [None])[0] or {}
                if items.status_code != 200 or not first.get("id"):
                    items.failure(f"items {items.status_code} {body}")
                    return
                items.success()

            with self.client.post("/api/auth/logout", name="logout", catch_response=True) as logout:
                if logout.status_code != 204:
                    logout.failure(f"logout {logout.status_code}")
                else:
                    logout.success()
        finally:
            if profile() == "smoke":
                raise StopTest("smoke: one user / one iteration")
