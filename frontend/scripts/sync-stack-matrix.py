#!/usr/bin/env python
"""Sync deploy/matrix.yaml → frontend/_shared/.../stack/matrix.json (public Stack SSOT)."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # reference-app-copy/
MATRIX = ROOT / "deploy" / "matrix.yaml"
OUT = (
    ROOT
    / "frontend"
    / "_shared"
    / "frontend-javascript-app"
    / "stack"
    / "matrix.json"
)
STATUS_SERVER = ROOT / "deploy" / "services-status-server.py"


def load_matrix(path: Path) -> dict:
    spec = importlib.util.spec_from_file_location("services_status_server", STATUS_SERVER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {STATUS_SERVER}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod._load_yaml_lite(path)


def main() -> int:
    data = load_matrix(MATRIX)
    payload = {
        "backends": [
            {
                "id": b["id"],
                "status": b.get("status", "active"),
                "language": b.get("language"),
            }
            for b in data.get("backends", [])
        ],
        "frontends": [
            {
                "id": f["id"],
                "status": f.get("status", "active"),
                "kind": f.get("kind"),
            }
            for f in data.get("frontends", [])
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)} "
        f"({len(payload['backends'])} be · {len(payload['frontends'])} fe)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
