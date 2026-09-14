"""Login once, stamp Bearer into vegeta targets (open-loop ammo).

Vegeta does not keep a VU session. The target set is still health → login → me →
items → logout; me/logout reuse the token from this prepare step.
"""
from __future__ import annotations

import json
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import api_base_url, password, refuse_shared_prod, username


def _login(base_url: str) -> str:
    payload = json.dumps({"username": username(), "password": password()}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/api/auth/login",
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "tests-go-vegeta",
        },
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise SystemExit(f"STOP: prepare login failed against {base_url}: {exc}") from exc
    token = str(body.get("token") or "")
    if body.get("username") != username() or not token:
        raise SystemExit(f"STOP: prepare login rejected: {body}")
    return token


def _target(method: str, url: str, headers: list[tuple[str, str]], body_ref: str = "") -> str:
    lines = [f"{method} {url}"]
    for key, value in headers:
        lines.append(f"{key}: {value}")
    if body_ref:
        lines.append(body_ref)
    return "\n".join(lines) + "\n"


def write_targets(path: Path, base: str, token: str, login_body: Path) -> None:
    json_headers = [
        ("Accept", "application/json"),
        ("Content-Type", "application/json"),
        ("User-Agent", "tests-go-vegeta"),
    ]
    base_headers = [
        ("Accept", "application/json"),
        ("User-Agent", "tests-go-vegeta"),
    ]
    auth_headers = base_headers + [("Authorization", f"Bearer {token}")]
    packets = [
        _target("GET", f"{base}/api/health", base_headers),
        _target("POST", f"{base}/api/auth/login", json_headers, f"@{login_body}"),
        _target("GET", f"{base}/api/auth/me", auth_headers),
        _target("GET", f"{base}/api/items", base_headers),
        _target("POST", f"{base}/api/auth/logout", auth_headers),
    ]
    path.write_text("\n".join(packets) + "\n", encoding="utf-8")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    out = root / "build" / "vegeta"
    out.mkdir(parents=True, exist_ok=True)
    base = api_base_url()
    refuse_shared_prod(base)
    token = _login(base)
    login_body = out / "login.json"
    login_body.write_text(
        json.dumps({"username": username(), "password": password()}, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    targets = out / "targets.txt"
    write_targets(targets, base, token, login_body)
    print(f"targets {targets} token {token[:8]}…")
    print(f"login.json {login_body} {base}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
