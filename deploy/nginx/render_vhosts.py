#!/usr/bin/env python
"""Render host nginx vhosts from deploy/matrix.yaml (active + stub backends)."""

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

    data: dict = {"backends": [], "frontends": [], "web": {}, "edge": {}}
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
            if section in ("web", "edge"):
                data[section] = {}
            elif section in ("backends", "frontends"):
                data[section] = []
            elif section == "domain_suffix":
                section = "domain_suffix"
            continue

        if section == "domain_suffix" and indent == 0 and ":" in line:
            # domain_suffix: value on same line handled below when section set wrong
            pass

        if indent == 0 and line.startswith("domain_suffix:"):
            data["domain_suffix"] = _parse_scalar(line.split(":", 1)[1])
            section = None
            continue

        if section in ("web", "edge") and indent == 2 and ":" in line:
            key, _, val = line.partition(":")
            data[section][key.strip()] = _parse_scalar(val)
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
    web_port = int(matrix["web"]["publish_port"])
    args.out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for backend in matrix.get("backends", []):
        if backend.get("status") not in want:
            continue
        bid_us = backend["id"].replace("-", "_")
        conf = (
            template.replace("__BACKEND_ID__", bid_us)
            .replace("__PUBLIC_HOST__", backend["public_host"])
            .replace("__API_PORT__", str(backend["publish_port"]))
            .replace("__WEB_PORT__", str(web_port))
        )
        out = args.out_dir / f"{backend['public_host']}.conf"
        out.write_text(conf, encoding="utf-8")
        print(f"wrote {out}")
        written += 1

    if not written:
        print("No backends matched statuses", want, file=sys.stderr)
        return 1
    print(f"OK: {written} vhost(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
