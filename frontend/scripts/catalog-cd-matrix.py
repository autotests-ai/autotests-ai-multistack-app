#!/usr/bin/env python
"""Catalog CD matrix from deploy/matrix.yaml (frontends without teaching: true).

Writes `deploy/catalog-matrix.json` for CI (`catalog-matrix` job reads JSON; no
Python on the runner). Skill / humans regenerate after editing matrix.yaml:

  python frontend/scripts/catalog-cd-matrix.py --write

`context` is the frontend module directory (compose / catalog-build context=module).
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parents[1]


def resolve_yaml() -> Path:
    local = ROOT / "deploy" / "matrix.yaml"
    if local.is_file():
        return local
    live = ROOT.parent / "autotests-ai-multistack-app" / "deploy" / "matrix.yaml"
    if live.is_file():
        return live
    raise SystemExit(f"STOP: deploy/matrix.yaml not found from {ROOT}")


def _load_yaml(path: Path) -> dict:
    status_server = path.parent / "services-status-server.py"
    if not status_server.is_file():
        raise SystemExit(f"STOP: {status_server} missing next to matrix.yaml")
    spec = importlib.util.spec_from_file_location("services_status_server", status_server)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {status_server}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod._load_yaml_lite(path)


def _is_teaching(frontend: dict) -> bool:
    value = frontend.get("teaching")
    return value is True or value == "true"


def catalog_frontends(data: dict, repo_root: Path) -> list[dict]:
    rows: list[dict] = []
    teaching: list[str] = []
    for frontend in data.get("frontends") or []:
        fid = str(frontend.get("id") or "").strip()
        if not fid:
            continue
        if _is_teaching(frontend):
            teaching.append(fid)
            continue
        module = str(frontend.get("module") or "").strip()
        service = str(frontend.get("compose_service") or fid).strip()
        dockerfile = f"{module}/Dockerfile" if module else ""
        rows.append(
            {
                "service": service,
                "dockerfile": dockerfile,
                "context": module,
                "id": fid,
            }
        )
    if len(teaching) != 1:
        raise SystemExit(
            f"STOP: need exactly one frontend with teaching: true, got {teaching or 'none'}"
        )
    if not rows:
        raise SystemExit("STOP: no catalog frontends (all marked teaching?)")
    missing = [r["dockerfile"] for r in rows if not (repo_root / r["dockerfile"]).is_file()]
    if missing:
        raise SystemExit("STOP: missing Dockerfiles: " + ", ".join(missing))
    return rows


def _payload(include: list[dict], services: str) -> dict:
    return {"include": include, "services": services}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Catalog CD services from deploy/matrix.yaml")
    parser.add_argument("--pretty", action="store_true", help="print JSON include list")
    parser.add_argument(
        "--write",
        nargs="?",
        const="deploy/catalog-matrix.json",
        default=None,
        help="write JSON for CI (default path: deploy/catalog-matrix.json)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit 1 if committed JSON does not match matrix.yaml",
    )
    parser.add_argument("--yaml", type=Path, default=None, help="override deploy/matrix.yaml")
    args = parser.parse_args(argv)

    yaml_path = args.yaml.resolve() if args.yaml else resolve_yaml()
    if not yaml_path.is_file():
        print(f"STOP: {yaml_path} not found", file=sys.stderr)
        return 2

    repo_root = yaml_path.parent.parent
    rows = catalog_frontends(_load_yaml(yaml_path), repo_root)
    include = [
        {
            "service": r["service"],
            "dockerfile": r["dockerfile"],
            "context": r["context"],
        }
        for r in rows
    ]
    services = " ".join(r["service"] for r in rows)
    payload = _payload(include, services)
    text = json.dumps(payload, indent=2) + "\n"
    default_json = repo_root / "deploy" / "catalog-matrix.json"
    json_path = Path(args.write) if args.write else default_json
    if not json_path.is_absolute():
        json_path = repo_root / json_path

    if args.check:
        if not json_path.is_file():
            print(f"STOP: {json_path} missing — run with --write", file=sys.stderr)
            return 1
        committed = json.loads(json_path.read_text(encoding="utf-8"))
        if committed != payload:
            print(f"STOP: {json_path} stale vs {yaml_path} — run with --write", file=sys.stderr)
            return 1
        print(f"ok: {json_path} matches {yaml_path.name}")
        return 0

    write_path = json_path if args.write or not args.pretty else None
    if write_path is None and not args.pretty:
        write_path = default_json
    if write_path is not None:
        write_path.parent.mkdir(parents=True, exist_ok=True)
        write_path.write_text(text, encoding="utf-8")
        print(f"wrote {write_path}", file=sys.stderr)
    if args.pretty or write_path is None or not args.write:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
