#!/usr/bin/env python3
"""Fail if teaching ci.yml grows a GHA sibling matrix.

Teaching CD is one cell from env knobs (FRONTEND_LANG + FRONTEND_FRAMEWORK),
same rule as backend. Sibling SPAs stay on host compose (/stack/), not
jobs.*.strategy.matrix. Header/nav fixes belong in the SPA source.

Usage: python3 assert_teaching_ci.py [path-to-ci.yml]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

STRATEGY_KEY = re.compile(r"(?m)^[ \t]+strategy:[ \t]*(\{.*)?$")
MATRIX_KEY = re.compile(r"(?m)^[ \t]+matrix:")
CATALOG_JOB = re.compile(r"(?m)^[ \t]*catalog-[A-Za-z0-9_-]*:")
HARDCODED_FE_CELL = re.compile(
    r"(?m)^[ \t]+-[ \t]+frontend/(?:javascript|typescript)/frontend-(?:javascript|typescript)-[a-z0-9-]+"
)
COMPOSE_SERVICES = re.compile(r"(?m)^[ \t]+DEPLOY_COMPOSE_SERVICES:[ \t]*(.+)$")
BUILD_FE_DOCKER = re.compile(
    r"build-frontend:[\s\S]*?uses:\s*\./\.github/actions/docker-build"
)
FRONTEND_SIBLING = re.compile(r"frontend-[a-z0-9-]+")


def without_comments(text: str) -> str:
    kept: list[str] = []
    for line in text.splitlines():
        if line.lstrip().startswith("#"):
            continue
        kept.append(line)
    return "\n".join(kept)


def problems(text: str) -> list[str]:
    body = without_comments(text)
    found: list[str] = []
    if STRATEGY_KEY.search(body):
        found.append(
            "jobs.*.strategy is forbidden — teaching CI is one cell from knobs, "
            "not a GHA cartesian (GitHub graph label 'Matrix: …')"
        )
    if MATRIX_KEY.search(body):
        found.append("jobs.*.strategy.matrix is forbidden")
    if "matrix.module_dir" in body:
        found.append("matrix.module_dir is forbidden")
    if CATALOG_JOB.search(body):
        found.append("catalog-* jobs were removed; do not restore sidecar catalog CD")
    if HARDCODED_FE_CELL.search(body):
        found.append(
            "hardcoded sibling frontend module_dir list — use "
            "format('frontend/{0}/frontend-{0}-{1}', env.FRONTEND_LANG, env.FRONTEND_FRAMEWORK)"
        )
    if BUILD_FE_DOCKER.search(body):
        found.append(
            "build-frontend must use ./frontend/.github/actions/build, not docker-build"
        )
    for match in COMPOSE_SERVICES.finditer(body):
        names = FRONTEND_SIBLING.findall(match.group(1))
        if len(names) > 1:
            found.append(
                "DEPLOY_COMPOSE_SERVICES lists sibling frontends "
                f"({', '.join(names)}); leave unset so deploy uses the active cell basename"
            )
    return found


def _self_test() -> None:
    bad = """
  build-frontend:
    strategy:
      fail-fast: false
      matrix:
        module_dir:
          - frontend/javascript/frontend-javascript-vanilla
          - frontend/typescript/frontend-typescript-react
    steps:
      - uses: ./.github/actions/docker-build
        with:
          module_dir: ${{ matrix.module_dir }}
  deploy-frontend:
    env:
      DEPLOY_COMPOSE_SERVICES: frontend-javascript-vanilla frontend-typescript-react
  catalog-build:
    runs-on: ubuntu-24.04
"""
    good = """
  build-frontend:
    steps:
      - uses: ./frontend/.github/actions/build
        with:
          module_dir: ${{ format('frontend/{0}/frontend-{0}-{1}', env.FRONTEND_LANG, env.FRONTEND_FRAMEWORK) }}
  deploy-backend-load:
    env:
      DEPLOY_COMPOSE_SERVICES: postgres backend-java-spring
  # Do not GHA-matrix sibling test modules (same rule as frontends).
"""
    bad_found = problems(bad)
    if len(bad_found) < 5:
        raise SystemExit(f"assert-teaching-ci self-test: expected ≥5 hits, got {bad_found}")
    if problems(good):
        raise SystemExit(f"assert-teaching-ci self-test: false positive on good YAML: {problems(good)}")


def main(argv: list[str]) -> int:
    _self_test()
    if argv and argv[0] == "--self-test":
        print("assert-teaching-ci self-test OK")
        return 0
    path = Path(argv[0]) if argv else Path(".github/workflows/ci.yml")
    if not path.is_file():
        print(f"STOP: missing {path}", file=sys.stderr)
        return 1
    found = problems(path.read_text(encoding="utf-8"))
    if found:
        print("STOP: teaching ci.yml must stay one cell (no GHA sibling matrix)", file=sys.stderr)
        for item in found:
            print(f"- {item}", file=sys.stderr)
        return 1
    print(f"teaching ci.yml one-cell OK: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
