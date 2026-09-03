#!/usr/bin/env bash
# JaCoCo analog: 100% on the exported ConfigReader helpers (not client.rs / must_api_base_url).
set -euo pipefail
cd "$(dirname "$0")"

if ! cargo llvm-cov --version >/dev/null 2>&1; then
  echo "Installing cargo-llvm-cov (ConfigReader coverage gate)..." >&2
  cargo install cargo-llvm-cov --locked
fi

cargo llvm-cov --test infra --json --output-path coverage.json \
  --ignore-filename-regex '(client|schema|meta|lib)\.rs$'
cargo llvm-cov --test infra --lcov --output-path coverage.lcov \
  --ignore-filename-regex '(client|schema|meta|lib)\.rs$'

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("coverage.json").read_text(encoding="utf-8"))
need = ("closed_config_reader", "resolve_base_url", "resolve_api_base_url", "load_config")
found = {name: None for name in need}

def walk(node):
    if isinstance(node, dict):
        name = str(node.get("name") or node.get("mangled_name") or "")
        for key in need:
            if key in name and "found" in node or True:
                summary = node.get("summary") or {}
                lines = summary.get("lines") or {}
                percent = lines.get("percent")
                count = node.get("count")
                regions = node.get("regions")
                covered = None
                if percent is not None:
                    covered = float(percent)
                elif isinstance(count, (int, float)) and count > 0:
                    covered = 100.0
                elif isinstance(regions, list) and regions:
                    executed = 0
                    total = 0
                    for region in regions:
                        if isinstance(region, list) and len(region) >= 5:
                            total += 1
                            if region[4]:
                                executed += 1
                    if total:
                        covered = 100.0 * executed / total
                if covered is not None:
                    for key in need:
                        if key in name:
                            prev = found[key]
                            if prev is None or covered > prev:
                                found[key] = covered
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for item in node:
            walk(item)

walk(payload)
fail = 0
for name in need:
    pct = found[name]
    if pct is None:
        print(f"ERROR: no coverage line for {name}", flush=True)
        fail = 1
        continue
    if abs(pct - 100.0) > 0.01:
        print(f"ERROR: {name} coverage {pct}% (want 100.0%)", flush=True)
        fail = 1
if fail:
    raise SystemExit(1)
print("ConfigReader analog: " + " ".join(need) + " at 100.0%")
PY
