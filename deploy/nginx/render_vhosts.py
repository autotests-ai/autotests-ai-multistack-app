#!/usr/bin/env python
"""Render single host nginx vhost from deploy/matrix.yaml (active + stub backends)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def _load_with_pyyaml(text: str) -> dict:
    import yaml  # type: ignore

    return yaml.safe_load(text)


def _parse_scalar(raw: str):
    value = raw.strip()
    if value in ("null", "~", ""):
        return None
    if value in ("true", "false"):
        return value == "true"
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def load_matrix(path: Path) -> dict:
    """Load matrix.yaml — PyYAML if present, else constrained stdlib parser."""
    text = path.read_text(encoding="utf-8")
    try:
        return _load_with_pyyaml(text)
    except ImportError:
        pass

    data: dict = {"backends": [], "frontends": []}
    section: str | None = None
    current: dict | None = None

    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()

        if indent == 0 and line.endswith(":") and not line.startswith("-"):
            section = line[:-1]
            current = None
            if section in ("backends", "frontends"):
                data[section] = []
            continue

        if indent == 0 and ":" in line and not line.startswith("-"):
            key, _, val = line.partition(":")
            key = key.strip()
            if key in ("domain_suffix", "public_host", "ui_runtime", "react_ui"):
                data[key] = _parse_scalar(val)
                section = None
            continue

        if section in ("backends", "frontends"):
            if indent == 2 and line.startswith("- "):
                current = {}
                data[section].append(current)
                rest = line[2:].strip()
                if ":" in rest:
                    key, _, val = rest.partition(":")
                    current[key.strip()] = _parse_scalar(val)
                continue
            if current is not None and indent == 4 and ":" in line:
                key, _, val = line.partition(":")
                current[key.strip()] = _parse_scalar(val)
                continue

    return data


def public_host(matrix: dict) -> str:
    host = matrix.get("public_host") or matrix.get("domain_suffix")
    if not host:
        raise SystemExit("matrix.yaml missing public_host / domain_suffix")
    return str(host)


def render_backend_upstreams(backends: list[dict]) -> str:
    blocks: list[str] = []
    for backend in backends:
        bid_us = backend["id"].replace("-", "_")
        port = backend["publish_port"]
        blocks.append(
            "\n".join(
                [
                    f"upstream {bid_us}_api {{",
                    f"    server 127.0.0.1:{port};",
                    "    keepalive 8;",
                    "}",
                ]
            )
        )
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def render_frontend_upstreams(frontends: list[dict]) -> str:
    blocks: list[str] = []
    for frontend in frontends:
        fid_us = frontend["id"].replace("-", "_")
        port = frontend["publish_port"]
        blocks.append(
            "\n".join(
                [
                    f"upstream {fid_us} {{",
                    f"    server 127.0.0.1:{port};",
                    "    keepalive 8;",
                    "}",
                ]
            )
        )
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def render_api_locations(backends: list[dict]) -> str:
    chunks: list[str] = []
    for backend in backends:
        bid = backend["id"]
        bid_us = bid.replace("-", "_")
        chunks.append(
            "\n".join(
                [
                    f"    location = /{bid}/api {{",
                    f"        return 301 /{bid}/api/;",
                    "    }",
                    f"    location /{bid}/api/ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    f"        proxy_pass http://{bid_us}_api/api/;",
                    "    }",
                    "",
                ]
            )
        )
    return "\n".join(chunks)


def render_frontend_locations(frontends: list[dict]) -> str:
    """Strip /{backend}/{frontend} → / for per-frontend containers at docroot."""
    chunks: list[str] = []
    for frontend in frontends:
        fid = frontend["id"]
        fid_us = fid.replace("-", "_")
        chunks.append(
            "\n".join(
                [
                    f"    location ~ ^/backend-[^/]+/{fid}/?$ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    "        rewrite ^ / break;",
                    f"        proxy_pass http://{fid_us};",
                    "    }",
                    f"    location ~ ^/backend-[^/]+/{fid}/(.+)$ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    f"        rewrite ^/backend-[^/]+/{fid}/(.+)$ /$1 break;",
                    f"        proxy_pass http://{fid_us};",
                    "    }",
                    "",
                ]
            )
        )
    return "\n".join(chunks)


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--matrix",
        type=Path,
        default=repo / "deploy" / "matrix.yaml",
    )
    parser.add_argument(
        "--template",
        type=Path,
        default=repo / "deploy" / "nginx" / "vhost.template.conf",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=repo / "deploy" / "nginx" / "generated",
    )
    parser.add_argument(
        "--statuses",
        default="active,stub",
        help="Comma-separated backend statuses to render",
    )
    parser.add_argument(
        "--frontend-statuses",
        default="active",
        help="Comma-separated frontend statuses to render",
    )
    parser.add_argument(
        "--dump-json",
        action="store_true",
        help="Print parsed matrix as JSON and exit",
    )
    args = parser.parse_args()

    matrix = load_matrix(args.matrix)
    if args.dump_json:
        json.dump(matrix, sys.stdout, indent=2)
        print()
        return 0

    template = args.template.read_text(encoding="utf-8")
    want = {s.strip() for s in args.statuses.split(",") if s.strip()}
    want_fe = {s.strip() for s in args.frontend_statuses.split(",") if s.strip()}
    backends = [b for b in matrix.get("backends", []) if b.get("status") in want]
    frontends = [f for f in matrix.get("frontends", []) if f.get("status") in want_fe]
    if not backends:
        print("No backends matched statuses", want, file=sys.stderr)
        return 1
    if not frontends:
        print("No frontends matched statuses", want_fe, file=sys.stderr)
        return 1

    host = public_host(matrix)
    conf = (
        template.replace("__PUBLIC_HOST__", host)
        .replace("__BACKEND_UPSTREAMS__", render_backend_upstreams(backends))
        .replace("__FRONTEND_UPSTREAMS__", render_frontend_upstreams(frontends))
        .replace("__BACKEND_API_LOCATIONS__", render_api_locations(backends))
        .replace("__FRONTEND_LOCATIONS__", render_frontend_locations(frontends))
    )

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for old in args.out_dir.glob("*.conf"):
        old.unlink()

    out = args.out_dir / f"{host}.conf"
    out.write_text(conf, encoding="utf-8")
    print(f"wrote {out}")
    print(f"OK: 1 vhost ({len(backends)} backends, {len(frontends)} frontends)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
