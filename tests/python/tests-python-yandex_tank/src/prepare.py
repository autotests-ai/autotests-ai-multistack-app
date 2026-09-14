"""Login once, stamp Bearer into request-style ammo, write phantom load.yaml.

Phantom does not keep a VU session. The ammo chain is still health → login → me →
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
from config import (
    api_base_url,
    during_seconds,
    password,
    profile,
    ramp_seconds,
    refuse_shared_prod,
    split_target,
    username,
    users,
)


def _login(base_url: str) -> str:
    payload = json.dumps({"username": username(), "password": password()}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/api/auth/login",
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "tests-python-yandex_tank",
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


def _http_request(method: str, path: str, headers: list[tuple[str, str]], body: str = "") -> bytes:
    lines = [f"{method} {path} HTTP/1.1"]
    hdrs = list(headers)
    raw = body.encode("utf-8") if body else b""
    if raw:
        hdrs.append(("Content-Length", str(len(raw))))
    elif method in ("POST", "PUT", "PATCH"):
        hdrs.append(("Content-Length", "0"))
    for key, value in hdrs:
        lines.append(f"{key}: {value}")
    lines.append("")
    head = "\n".join(lines) + "\n"
    return head.encode("utf-8") + raw


def _ammo_entry(tag: str, request: bytes) -> bytes:
    return f"{len(request)} {tag}\n".encode("utf-8") + request + b"\n"


def write_ammo(path: Path, prefix: str, host: str, token: str) -> None:
    base_headers = [
        ("Host", host),
        ("Accept", "application/json"),
        ("User-Agent", "tests-python-yandex_tank"),
    ]
    json_headers = base_headers + [("Content-Type", "application/json")]
    auth_headers = base_headers + [("Authorization", f"Bearer {token}")]
    login_body = json.dumps({"username": username(), "password": password()}, separators=(",", ":"))
    packets = [
        ("health", _http_request("GET", f"{prefix}/api/health", base_headers)),
        ("login", _http_request("POST", f"{prefix}/api/auth/login", json_headers, login_body)),
        ("me", _http_request("GET", f"{prefix}/api/auth/me", auth_headers)),
        ("items", _http_request("GET", f"{prefix}/api/items", base_headers)),
        ("logout", _http_request("POST", f"{prefix}/api/auth/logout", auth_headers)),
    ]
    blob = b"".join(_ammo_entry(tag, req) for tag, req in packets)
    path.write_bytes(blob)


def write_load_yaml(
    path: Path,
    *,
    address: str,
    ssl_on: bool,
    instances: int,
    schedule: str,
    ammo: Path,
    phout: Path,
    artifacts: Path,
) -> None:
    ssl_flag = "true" if ssl_on else "false"
    ammo_s = str(ammo)
    phout_s = str(phout)
    artifacts_s = str(artifacts)
    text = f"""core:
  artifacts_base_dir: "{artifacts_s}"
  artifacts_dir: "{artifacts_s}"
  lock_dir: "{artifacts_s}"
  ignore_lock: true
phantom:
  enabled: true
  package: yandextank.plugins.Phantom
  address: {address}
  ssl: {ssl_flag}
  header_http: "1.1"
  ammo_type: phantom
  ammofile: "{ammo_s}"
  phout_file: "{phout_s}"
  instances: {instances}
  timeout: 15s
  use_caching: false
  force_stepping: 1
  cache_dir: "{artifacts_s}"
  load_profile:
    load_type: rps
    schedule: "{schedule}"
json_report:
  enabled: true
  package: yandextank.plugins.JsonReport
autostop:
  enabled: false
  package: yandextank.plugins.Autostop
telegraf:
  enabled: false
  package: yandextank.plugins.Telegraf
jmeter:
  enabled: false
  package: yandextank.plugins.JMeter
bfg:
  enabled: false
  package: yandextank.plugins.Bfg
pandora:
  enabled: false
  package: yandextank.plugins.Pandora
overload:
  enabled: false
  package: yandextank.plugins.DataUploader
uploader:
  enabled: false
  package: yandextank.plugins.DataUploader
influx:
  enabled: false
  package: yandextank.plugins.InfluxUploader
shellexec:
  enabled: false
  package: yandextank.plugins.ShellExec
platform:
  enabled: false
  package: yandextank.plugins.Platform
console:
  enabled: true
  package: yandextank.plugins.Console
"""
    path.write_text(text, encoding="utf-8")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    out = root / "build" / "tank"
    out.mkdir(parents=True, exist_ok=True)
    base = api_base_url()
    refuse_shared_prod(base)
    host, port, ssl_on, prefix = split_target(base)
    host_header = host if (ssl_on and port == 443) or (not ssl_on and port == 80) else f"{host}:{port}"
    address = f"{host}:{port}"
    token = _login(base)
    ammo = out / "ammo.txt"
    phout = out / "phout.log"
    cfg = out / "load.yaml"
    write_ammo(ammo, prefix, host_header, token)
    if profile() == "load":
        instances = users()
        hold = during_seconds()
        ramp = ramp_seconds()
        schedule = f"line(1, {instances}, {ramp}s) const({instances}, {hold}s)"
    else:
        instances = 1
        schedule = "const(1, 25s)"
    write_load_yaml(
        cfg,
        address=address,
        ssl_on=ssl_on,
        instances=instances,
        schedule=schedule,
        ammo=ammo,
        phout=phout,
        artifacts=out,
    )
    print(f"ammo {ammo} token {token[:8]}…")
    print(f"load.yaml {cfg} {address} ssl={ssl_on} instances={instances} {schedule}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
