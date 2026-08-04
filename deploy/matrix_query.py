#!/usr/bin/env python
"""Query deploy/matrix.yaml for compose/health/CD (SSOT reader)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "deploy" / "nginx"))
from render_vhosts import load_matrix  # noqa: E402

DEFAULT_MATRIX = ROOT / "deploy" / "matrix.yaml"
DEPLOY_MATRIX_JSON = ROOT / "deploy" / "deploy-matrix.json"
DEFAULT_BACKENDS = "backend-java-spring"
DEFAULT_FRONTENDS = "frontend-typescript-react"
ACTIVE_BACKEND = ("active", "stub")
ACTIVE_FRONTEND = ("active",)


def _csv_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def _by_id(items: list[dict], ids: list[str]) -> list[dict]:
    index = {item["id"]: item for item in items}
    missing = [i for i in ids if i not in index]
    if missing:
        raise SystemExit(f"FAIL: unknown matrix id(s): {', '.join(missing)}")
    return [index[i] for i in ids]


def _active(items: list[dict], statuses: tuple[str, ...]) -> list[dict]:
    return [item for item in items if item.get("status") in statuses]


def resolve_backends(matrix: dict, raw: str | None, mode: str) -> list[dict]:
    items = matrix.get("backends") or []
    if mode == "all" or (raw or "").strip() in ("", "all"):
        return _active(items, ACTIVE_BACKEND)
    return _by_id(items, _csv_ids(raw))


def resolve_frontends(matrix: dict, raw: str | None, mode: str) -> list[dict]:
    items = matrix.get("frontends") or []
    if mode == "all" or (raw or "").strip() in ("", "all"):
        return _active(items, ACTIVE_FRONTEND)
    return _by_id(items, _csv_ids(raw))


def cmd_ids(matrix: dict, args: argparse.Namespace) -> int:
    if args.section == "backends":
        rows = resolve_backends(matrix, None if args.mode == "all" else args.ids, args.mode)
    else:
        rows = resolve_frontends(matrix, None if args.mode == "all" else args.ids, args.mode)
    ids = [row["id"] for row in rows]
    print(",".join(ids) if args.csv else "\n".join(ids))
    return 0


def cmd_compose_services(matrix: dict, args: argparse.Namespace) -> int:
    backends = resolve_backends(matrix, args.backends, args.mode)
    frontends = resolve_frontends(matrix, args.frontends, args.mode)
    services = ["postgres", "postgres-ensure-dbs"]
    for row in backends:
        svc = row.get("compose_service") or row["id"]
        if svc not in services:
            services.append(svc)
    for row in frontends:
        svc = row.get("compose_service") or row["id"]
        if not svc:
            raise SystemExit(f"FAIL: frontend {row['id']} has no compose_service")
        if svc not in services:
            services.append(svc)
    print(" ".join(services))
    return 0


def cmd_health(matrix: dict, args: argparse.Namespace) -> int:
    backends = resolve_backends(matrix, args.backends, args.mode)
    frontends = resolve_frontends(matrix, args.frontends, args.mode)
    for row in backends:
        port = row.get("publish_port")
        expect = row.get("health_service") or row["id"]
        if port is None:
            raise SystemExit(f"FAIL: backend {row['id']} missing publish_port")
        print(f"backend\t{row['id']}\t{port}\t{expect}")
    for row in frontends:
        port = row.get("publish_port")
        if port is None:
            raise SystemExit(f"FAIL: frontend {row['id']} missing publish_port")
        print(f"frontend\t{row['id']}\t{port}\t")
    return 0


def _build_row(row: dict) -> dict:
    module = row.get("module")
    if not module:
        raise SystemExit(f"FAIL: {row.get('id')} missing module")
    compose_service = row.get("compose_service") or row["id"]
    image = row.get("image") or f"reference-app-copy-{row['id']}:latest"
    return {
        "id": row["id"],
        "module": module,
        "compose_service": compose_service,
        "image": image,
    }


def cmd_build_matrix(matrix: dict, args: argparse.Namespace) -> int:
    """JSON array for compose build targets (local / debug)."""
    backends = resolve_backends(matrix, args.backends, args.mode)
    frontends = resolve_frontends(matrix, args.frontends, args.mode)
    rows = [_build_row(row) for row in backends + frontends]
    if not rows:
        raise SystemExit("FAIL: empty build matrix")
    print(json.dumps(rows))
    return 0


def cmd_sync_deploy_matrix(matrix: dict, args: argparse.Namespace) -> int:
    """Write deploy/deploy-matrix.json for GHA (no Python in workflows)."""
    backends = resolve_backends(matrix, None, "all")
    frontends = resolve_frontends(matrix, None, "all")
    targets = []
    for row in backends:
        targets.append({"kind": "backend", **_build_row(row)})
    for row in frontends:
        targets.append({"kind": "frontend", **_build_row(row)})
    if not targets:
        raise SystemExit("FAIL: empty deploy-matrix targets")
    payload = {
        "source": "deploy/matrix.yaml",
        "defaults": {
            "backends": _csv_ids(DEFAULT_BACKENDS),
            "frontends": _csv_ids(DEFAULT_FRONTENDS),
        },
        "all": {
            "backends": [row["id"] for row in backends],
            "frontends": [row["id"] for row in frontends],
        },
        "targets": targets,
    }
    out = args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {out.relative_to(ROOT)} "
        f"({len(payload['all']['backends'])} be · {len(payload['all']['frontends'])} fe)"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_ids = sub.add_parser("ids", help="Print backend/frontend ids")
    p_ids.add_argument("section", choices=("backends", "frontends"))
    p_ids.add_argument("--mode", choices=("default", "all"), default="all")
    p_ids.add_argument("--ids", default="")
    p_ids.add_argument("--csv", action="store_true")
    p_ids.set_defaults(func=cmd_ids)

    p_compose = sub.add_parser("compose-services", help="Compose service names to up")
    p_compose.add_argument("--mode", choices=("default", "all"), default="default")
    p_compose.add_argument("--backends", default=DEFAULT_BACKENDS)
    p_compose.add_argument("--frontends", default=DEFAULT_FRONTENDS)
    p_compose.set_defaults(func=cmd_compose_services)

    p_health = sub.add_parser("health", help="TSV health targets from matrix")
    p_health.add_argument("--mode", choices=("default", "all"), default="default")
    p_health.add_argument("--backends", default=DEFAULT_BACKENDS)
    p_health.add_argument("--frontends", default=DEFAULT_FRONTENDS)
    p_health.set_defaults(func=cmd_health)

    p_build = sub.add_parser("build-matrix", help="JSON matrix for CD image builds (local)")
    p_build.add_argument("--mode", choices=("default", "all"), default="default")
    p_build.add_argument("--backends", default=DEFAULT_BACKENDS)
    p_build.add_argument("--frontends", default=DEFAULT_FRONTENDS)
    p_build.set_defaults(func=cmd_build_matrix)

    p_sync = sub.add_parser(
        "sync-deploy-matrix",
        help="Regenerate deploy/deploy-matrix.json after matrix.yaml changes (commit the JSON)",
    )
    p_sync.add_argument("--out", type=Path, default=DEPLOY_MATRIX_JSON)
    p_sync.set_defaults(func=cmd_sync_deploy_matrix)

    args = parser.parse_args()
    matrix = load_matrix(args.matrix)
    return args.func(matrix, args)


if __name__ == "__main__":
    raise SystemExit(main())
