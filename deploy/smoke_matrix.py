#!/usr/bin/env python
"""Smoke active/stub backends × active frontends over HTTPS (strict TLS)."""

from __future__ import annotations

import argparse
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "deploy" / "nginx"))
from render_vhosts import load_matrix, public_host  # noqa: E402


def http_code(url: str, ctx: ssl.SSLContext) -> int:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            return int(resp.status)
    except urllib.error.HTTPError as exc:
        return int(exc.code)


def http_body(url: str, ctx: ssl.SSLContext) -> str:
    with urllib.request.urlopen(url, context=ctx, timeout=30) as resp:
        return resp.read().decode()


def smoke_one(origin: str, backend_id: str, ui_mount: str, service: str, ctx: ssl.SSLContext) -> None:
    origin = origin.rstrip("/")
    base = f"{origin}/{backend_id}"
    ui_path = f"/{ui_mount}/"

    print(f"=== TLS + GET {origin}/ (expect 404) ===")
    code = http_code(f"{origin}/", ctx)
    print(f"HTTP {code}")
    if code != 404:
        raise SystemExit(f"FAIL: expected 404 at host root, got {code}")

    print(f"=== GET {base}{ui_path} ===")
    code = http_code(f"{base}{ui_path}", ctx)
    print(f"HTTP {code}")
    if code != 200:
        raise SystemExit(f"FAIL: expected 200 at UI mount, got {code}")

    print(f"=== GET {base}/api/health (expect {service}) ===")
    body = http_body(f"{base}/api/health", ctx)
    print(body)
    if '"status":"ok"' not in body:
        raise SystemExit("FAIL: missing ok status")
    if service not in body:
        raise SystemExit(f"FAIL: missing {service}")
    print(f"Smoke OK: {base}{ui_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "base_url",
        nargs="?",
        help="Optional single origin URL (skips matrix loop), e.g. https://reference-app-copy.autotests.ai",
    )
    parser.add_argument("--matrix", type=Path, default=ROOT / "deploy" / "matrix.yaml")
    parser.add_argument("--backend", default="backend-java-spring")
    parser.add_argument("--ui-mount", default="frontend-typescript-react")
    parser.add_argument("--service", default="reference-app-copy")
    args = parser.parse_args()
    ctx = ssl.create_default_context()

    if args.base_url:
        smoke_one(args.base_url, args.backend, args.ui_mount, args.service, ctx)
        return 0

    matrix = load_matrix(args.matrix)
    origin = f"https://{public_host(matrix)}"
    backends = [b for b in matrix["backends"] if b.get("status") in ("active", "stub")]
    frontends = [f for f in matrix["frontends"] if f.get("status") == "active"]
    if not backends or not frontends:
        print("FAIL: no backends/frontends to smoke", file=sys.stderr)
        return 1

    for backend in backends:
        for frontend in frontends:
            smoke_one(
                origin,
                backend["id"],
                frontend["mount"],
                backend["health_service"],
                ctx,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
