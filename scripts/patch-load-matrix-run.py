#!/usr/bin/env python3
"""Upsert one load-board run: report URL, optional github/values.

  python3 scripts/patch-load-matrix-run.py \\
    --matrix /var/www/load.autotests.ai/matrix.json \\
    --injector java-jmeter --backend backend-java-spring \\
    --report /runs/java-jmeter::backend-java-spring/34534777358/ \\
    --github https://github.com/autotests-ai/autotests-ai-multistack-app/actions/runs/34534777358 \\
    --value 'p95 806ms' --value '2.4 rps'

Does not write injector HTML. School keys only (injector.appliesTo × backend.family).
"""
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

REPORT_PREFIX = "/runs/"
REPORT_ABS = "https://load.autotests.ai/runs/"


def applies_to(injector: dict) -> list[str]:
    targets = injector.get("appliesTo")
    if isinstance(targets, list) and targets:
        return targets
    return [injector["family"]]


def is_applicable(injector: dict, backend: dict) -> bool:
    targets = applies_to(injector)
    if "*" in targets:
        return True
    return backend["family"] in targets


def assert_report(value: str) -> str:
    report = value.strip()
    if report.startswith(REPORT_PREFIX) or report.startswith(REPORT_ABS):
        return report
    raise SystemExit(
        "STOP: --report must be /runs/... or https://load.autotests.ai/runs/..."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--matrix", type=Path, required=True)
    parser.add_argument("--from-json", type=Path, default=None)
    parser.add_argument("--injector", default="")
    parser.add_argument("--backend", default="")
    parser.add_argument("--report", default="")
    parser.add_argument("--github", default="")
    parser.add_argument("--value", action="append", dest="values", default=[])
    args = parser.parse_args()
    if args.from_json is not None:
        payload = json.loads(args.from_json.read_text(encoding="utf-8"))
        args.injector = str(payload.get("injector") or args.injector)
        args.backend = str(payload.get("backend") or args.backend)
        args.report = str(payload.get("report") or args.report)
        args.github = str(payload.get("github") or args.github)
        if payload.get("values"):
            args.values = [str(item) for item in payload["values"]]
    if not args.injector or not args.backend:
        parser.error("need --injector and --backend (or --from-json)")
    if not args.report and not args.github and not args.values:
        parser.error("need --report and/or --github and/or --value")

    data = json.loads(args.matrix.read_text(encoding="utf-8"))
    injector = next((item for item in data["injectors"] if item["id"] == args.injector), None)
    backend = next((item for item in data["backends"] if item["id"] == args.backend), None)
    if injector is None:
        raise SystemExit(f"STOP: unknown injector {args.injector}")
    if backend is None:
        raise SystemExit(f"STOP: unknown backend {args.backend}")
    if not is_applicable(injector, backend):
        raise SystemExit(
            f"STOP: {args.injector}::{args.backend} is not a school; "
            f"add {backend['family']!r} to injectors[].appliesTo first"
        )

    key = f"{args.injector}::{args.backend}"
    prev = data.get("runs", {}).get(key)
    run: dict = dict(prev) if isinstance(prev, dict) else {}
    if args.values:
        run["values"] = args.values
    if args.github:
        run["github"] = args.github
    if args.report:
        run["report"] = assert_report(args.report)
    if not run.get("values") and not run.get("github") and not run.get("grafana") and not run.get("report"):
        raise SystemExit("STOP: run entry needs values, github, grafana, or report")
    data.setdefault("runs", {})[key] = run
    data["updated"] = date.today().isoformat()
    args.matrix.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"ok {key} → {args.matrix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
