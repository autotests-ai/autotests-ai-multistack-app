#!/usr/bin/env python
"""Local status board for autotests-ai-multistack-app published services.

Serves deploy/services-status.html and GET /api/status (live probes).
SSOT ports: deploy/matrix.yaml · live publish: docker compose ps.
"""
from __future__ import annotations

import argparse
import json
import socket
import subprocess
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MATRIX_PATH = Path(__file__).resolve().parent / "matrix.yaml"
HTML_PATH = Path(__file__).resolve().parent / "services-status.html"


def _load_yaml_lite(path: Path) -> dict[str, Any]:
    """Minimal YAML loader for matrix.yaml shape (no PyYAML dependency)."""
    try:
        import yaml  # type: ignore

        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        pass

    # Fallback: parse known list blocks (id / status / publish_port / compose_service).
    text = path.read_text(encoding="utf-8")
    data: dict[str, Any] = {"backends": [], "frontends": []}
    section: str | None = None
    current: dict[str, Any] | None = None

    def flush() -> None:
        nonlocal current
        if current and section in data:
            data[section].append(current)
        current = None

    for raw in text.splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if line in ("backends:", "frontends:"):
            flush()
            section = line[:-1]
            continue
        if line.startswith("  - id:"):
            flush()
            current = {"id": line.split(":", 1)[1].strip()}
            continue
        if current is None or not line.startswith("    "):
            continue
        key, _, val = line.strip().partition(":")
        val = val.strip()
        if val in ("null", "~", ""):
            current[key] = None
        elif val.isdigit():
            current[key] = int(val)
        else:
            current[key] = val
    flush()
    return data


def _compose_ps() -> dict[str, dict[str, Any]]:
    """service → {state, status, published_ports, health}."""
    try:
        r = subprocess.run(
            ["docker", "compose", "ps", "--format", "json", "-a"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (OSError, subprocess.TimeoutExpired):
        return {}
    if r.returncode != 0:
        return {}

    out: dict[str, dict[str, Any]] = {}
    for line in r.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        # docker compose may emit a JSON array (one shot) or NDJSON
        rows = row if isinstance(row, list) else [row]
        for item in rows:
            svc = item.get("Service") or item.get("Name") or ""
            if not svc:
                continue
            ports: list[int] = []
            for pub in item.get("Publishers") or []:
                p = pub.get("PublishedPort") or 0
                if p:
                    ports.append(int(p))
            # Fallback parse "0.0.0.0:8800->8080/tcp"
            if not ports:
                for part in (item.get("Ports") or "").split(","):
                    part = part.strip()
                    if "->" in part and ":" in part:
                        host = part.split("->", 1)[0]
                        try:
                            ports.append(int(host.rsplit(":", 1)[-1]))
                        except ValueError:
                            pass
            out[svc] = {
                "state": item.get("State") or "",
                "status": item.get("Status") or "",
                "health": item.get("Health") or "",
                "published_ports": sorted(set(ports)),
                "name": item.get("Name") or item.get("Names") or "",
            }
    return out


def _tcp_open(port: int, host: str = "127.0.0.1", timeout: float = 0.6) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _http_probe(url: str, timeout: float = 1.5) -> dict[str, Any]:
    t0 = time.perf_counter()
    try:
        req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json,*/*"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(200).decode("utf-8", errors="replace")
            ms = int((time.perf_counter() - t0) * 1000)
            return {
                "alive": 200 <= resp.status < 400,
                "http_status": resp.status,
                "latency_ms": ms,
                "body_preview": body[:120],
            }
    except urllib.error.HTTPError as e:
        ms = int((time.perf_counter() - t0) * 1000)
        return {"alive": False, "http_status": e.code, "latency_ms": ms, "error": str(e.reason)}
    except Exception as e:  # noqa: BLE001 — surface any probe failure
        ms = int((time.perf_counter() - t0) * 1000)
        return {"alive": False, "http_status": None, "latency_ms": ms, "error": str(e)}


def build_status() -> dict[str, Any]:
    matrix = _load_yaml_lite(MATRIX_PATH)
    compose = _compose_ps()
    services: list[dict[str, Any]] = []

    def add_entry(
        *,
        kind: str,
        svc_id: str,
        matrix_status: str,
        publish_port: int | None,
        check_path: str | None,
        compose_service: str | None,
    ) -> None:
        cs = compose.get(compose_service or svc_id) or {}
        ports = list(cs.get("published_ports") or [])
        port = ports[0] if ports else publish_port
        entry: dict[str, Any] = {
            "id": svc_id,
            "kind": kind,
            "matrix_status": matrix_status,
            "compose_service": compose_service or svc_id,
            "compose_state": cs.get("state") or ("missing" if matrix_status == "active" else "slot"),
            "compose_status": cs.get("status") or "",
            "compose_health": cs.get("health") or "",
            "publish_port": port,
            "matrix_port": publish_port,
            "check_path": check_path,
            "url": f"http://127.0.0.1:{port}{check_path}" if port and check_path else None,
            "tcp_open": bool(port and _tcp_open(int(port))),
            "http": None,
            "alive": False,
        }
        if entry["url"] and matrix_status == "active":
            entry["http"] = _http_probe(entry["url"])
            entry["alive"] = bool(entry["http"].get("alive"))
        elif entry["tcp_open"] and matrix_status == "active":
            entry["alive"] = True
        elif cs.get("state") == "running" and not port:
            # internal-only (postgres)
            entry["alive"] = (cs.get("health") or "").lower() in ("healthy", "") or "healthy" in (
                cs.get("status") or ""
            ).lower()
            if (cs.get("health") or "").lower() == "healthy":
                entry["alive"] = True
            elif "healthy" in (cs.get("status") or "").lower():
                entry["alive"] = True
            else:
                entry["alive"] = cs.get("state") == "running"
        services.append(entry)

    for b in matrix.get("backends") or []:
        add_entry(
            kind="backend",
            svc_id=b["id"],
            matrix_status=b.get("status") or "active",
            publish_port=b.get("publish_port"),
            check_path="/api/health",
            compose_service=b.get("compose_service") or b["id"],
        )

    for f in matrix.get("frontends") or []:
        add_entry(
            kind="frontend",
            svc_id=f["id"],
            matrix_status=f.get("status") or "active",
            publish_port=f.get("publish_port"),
            check_path="/",
            compose_service=f.get("compose_service") or f["id"],
        )

    known = {s["compose_service"] for s in services}
    # postgres + orphans (e.g. retired web gateway still running)
    for name, cs in sorted(compose.items()):
        if name in known or name == "postgres-ensure-dbs":
            continue
        ports = cs.get("published_ports") or []
        port = ports[0] if ports else None
        check = "/api/health" if name.startswith("backend") else ("/" if port else None)
        url = f"http://127.0.0.1:{port}{check}" if port and check else None
        http = _http_probe(url) if url else None
        alive = bool(http and http.get("alive"))
        if not alive and not port:
            alive = "healthy" in (cs.get("status") or "").lower() or (cs.get("health") or "").lower() == "healthy"
            if not alive:
                alive = cs.get("state") == "running"
        elif not alive and port:
            alive = _tcp_open(int(port))
        services.append(
            {
                "id": name,
                "kind": "infra" if name == "postgres" else "extra",
                "matrix_status": "runtime",
                "compose_service": name,
                "compose_state": cs.get("state") or "",
                "compose_status": cs.get("status") or "",
                "compose_health": cs.get("health") or "",
                "publish_port": port,
                "matrix_port": None,
                "check_path": check,
                "url": url,
                "tcp_open": bool(port and _tcp_open(int(port))),
                "http": http,
                "alive": alive,
            }
        )

    active = [s for s in services if s["matrix_status"] == "active"]
    return {
        "ok": True,
        "project": "autotests-ai-multistack-app",
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "matrix": str(MATRIX_PATH.relative_to(ROOT)),
        "summary": {
            "total": len(services),
            "active": len(active),
            "alive": sum(1 for s in active if s["alive"]),
            "down": sum(1 for s in active if not s["alive"]),
            "compose_running": sum(1 for s in services if s.get("compose_state") == "running"),
        },
        "services": services,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def _send(self, code: int, body: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path in ("/api/status", "/status.json"):
            payload = json.dumps(build_status(), ensure_ascii=False, indent=2).encode("utf-8")
            self._send(200, payload, "application/json; charset=utf-8")
            return
        if path in ("/", "/services-status.html", "/index.html"):
            if not HTML_PATH.is_file():
                self._send(404, b"services-status.html missing\n", "text/plain; charset=utf-8")
                return
            self._send(200, HTML_PATH.read_bytes(), "text/html; charset=utf-8")
            return
        self._send(404, b"not found\n", "text/plain; charset=utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8720)
    args = ap.parse_args()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"services-status http://{args.host}:{args.port}/", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
