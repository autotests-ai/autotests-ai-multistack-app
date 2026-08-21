#!/usr/bin/env python
"""Render nginx stack location fragments from deploy/matrix.yaml.

Outputs (wipe + rewrite generated/*.conf):
  autotests.ai-stack-{upstreams,routes}.conf
  stage.autotests.ai-stack-{upstreams,routes}.conf — +10000 ports, stage_ upstreams

Board (/stack/) is the landing gateway vhost, not teaching FE. Do not emit *-stack-board.conf.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

STACK_PREFIX = "/stack"
CANONICAL_HOST = "autotests.ai"
STAGE_HOST = "stage.autotests.ai"
STAGE_PORT_OFFSET = 10000
STAGE_UPSTREAM_PREFIX = "stage_"


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
            if key in (
                "domain_suffix",
                "public_host",
                "short_url_host",
            ):
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


def _us(service_id: str, prefix: str = "", suffix: str = "") -> str:
    return f"{prefix}{service_id.replace('-', '_')}{suffix}"


def _with_port_offset(entries: list[dict], offset: int) -> list[dict]:
    if not offset:
        return entries
    out: list[dict] = []
    for entry in entries:
        copy = dict(entry)
        copy["publish_port"] = int(entry["publish_port"]) + offset
        out.append(copy)
    return out


def render_backend_upstreams(backends: list[dict], us_prefix: str = "") -> str:
    blocks: list[str] = []
    for backend in backends:
        name = _us(backend["id"], us_prefix, "_api")
        port = backend["publish_port"]
        blocks.append(
            "\n".join(
                [
                    f"upstream {name} {{",
                    f"    server 127.0.0.1:{port};",
                    "    keepalive 8;",
                    "}",
                ]
            )
        )
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def render_frontend_upstreams(frontends: list[dict], us_prefix: str = "") -> str:
    blocks: list[str] = []
    for frontend in frontends:
        name = _us(frontend["id"], us_prefix)
        port = frontend["publish_port"]
        blocks.append(
            "\n".join(
                [
                    f"upstream {name} {{",
                    f"    server 127.0.0.1:{port};",
                    "    keepalive 8;",
                    "}",
                ]
            )
        )
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def render_api_locations(backends: list[dict], us_prefix: str = "") -> str:
    chunks: list[str] = []
    for backend in backends:
        bid = backend["id"]
        name = _us(bid, us_prefix, "_api")
        api_path = f"{STACK_PREFIX}/{bid}/api"
        chunks.append(
            "\n".join(
                [
                    f"    location = {api_path} {{",
                    f"        return 301 {api_path}/;",
                    "    }",
                    f"    location {api_path}/ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    f"        proxy_pass http://{name}/api/;",
                    "    }",
                    "",
                ]
            )
        )
    return "\n".join(chunks)


def render_frontend_locations(frontends: list[dict], us_prefix: str = "") -> str:
    """Strip /stack/{backend}/{frontend} → / for per-frontend containers at docroot."""
    chunks: list[str] = []
    prefix = re.escape(STACK_PREFIX)
    for frontend in frontends:
        fid = frontend["id"]
        name = _us(fid, us_prefix)
        chunks.append(
            "\n".join(
                [
                    f"    location ~ ^{prefix}/backend-[^/]+/{fid}/?$ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    "        rewrite ^ / break;",
                    f"        proxy_pass http://{name};",
                    "    }",
                    f"    location ~ ^{prefix}/backend-[^/]+/{fid}/(.+)$ {{",
                    "        proxy_http_version 1.1;",
                    "        proxy_set_header Host $host;",
                    "        proxy_set_header X-Real-IP $remote_addr;",
                    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
                    "        proxy_set_header X-Forwarded-Proto $scheme;",
                    f"        rewrite ^{prefix}/backend-[^/]+/{fid}/(.+)$ /$1 break;",
                    f"        proxy_pass http://{name};",
                    "    }",
                    "",
                ]
            )
        )
    return "\n".join(chunks)


def render_from_template(
    template: str,
    backends: list[dict],
    frontends: list[dict],
    us_prefix: str = "",
    **extra: str,
) -> str:
    conf = (
        template.replace("__BACKEND_UPSTREAMS__", render_backend_upstreams(backends, us_prefix))
        .replace("__FRONTEND_UPSTREAMS__", render_frontend_upstreams(frontends, us_prefix))
        .replace("__BACKEND_API_LOCATIONS__", render_api_locations(backends, us_prefix))
        .replace("__FRONTEND_LOCATIONS__", render_frontend_locations(frontends, us_prefix))
    )
    if "public_host" in extra:
        conf = conf.replace("__PUBLIC_HOST__", extra["public_host"])
    return conf


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--matrix",
        type=Path,
        default=repo / "deploy" / "matrix.yaml",
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

    stack_tpl = (repo / "deploy" / "nginx" / "stack-locations.template.conf").read_text(
        encoding="utf-8"
    )
    routes_tpl = (repo / "deploy" / "nginx" / "stack-routes.template.conf").read_text(
        encoding="utf-8"
    )

    stack_upstreams = render_from_template(stack_tpl, backends, frontends)
    stack_routes = render_from_template(routes_tpl, backends, frontends)

    stage_backends = _with_port_offset(backends, STAGE_PORT_OFFSET)
    stage_frontends = _with_port_offset(frontends, STAGE_PORT_OFFSET)
    stage_upstreams = render_from_template(
        stack_tpl, stage_backends, stage_frontends, us_prefix=STAGE_UPSTREAM_PREFIX
    )
    stage_routes = render_from_template(
        routes_tpl, stage_backends, stage_frontends, us_prefix=STAGE_UPSTREAM_PREFIX
    )

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for old in args.out_dir.glob("*.conf"):
        old.unlink()

    def _write(name: str, text: str) -> None:
        path = args.out_dir / name
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path}")

    _write(f"{CANONICAL_HOST}-stack-upstreams.conf", stack_upstreams)
    _write(f"{CANONICAL_HOST}-stack-routes.conf", stack_routes)
    _write(f"{STAGE_HOST}-stack-upstreams.conf", stage_upstreams)
    _write(f"{STAGE_HOST}-stack-routes.conf", stage_routes)
    print(
        f"OK: prod/stage stack fragments "
        f"({len(backends)} be, {len(frontends)} fe, stage +{STAGE_PORT_OFFSET})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
