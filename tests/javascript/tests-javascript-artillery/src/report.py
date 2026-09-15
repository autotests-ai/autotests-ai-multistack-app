"""Build k6-shaped summary.json from vegeta-compatible JSONL.

Native HTML is `artillery report` (index.html). This script must not overwrite it.
"""
from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path


def _percentile(values: list[float], p: float) -> float:
    xs = sorted(values)
    if not xs:
        return 0.0
    if len(xs) == 1:
        return xs[0]
    k = (len(xs) - 1) * p
    lo = math.floor(k)
    hi = math.ceil(k)
    if lo == hi:
        return xs[int(k)]
    return xs[lo] * (hi - k) + xs[hi] * (k - lo)


def _time_ms(raw: object) -> int | None:
    text = str(raw or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def latency_ms(raw: object) -> float | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        return float(raw) / 1_000_000.0
    text = str(raw).strip()
    try:
        return latency_ms(float(text))
    except ValueError:
        return None


def parse_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.is_file():
        return rows
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(row, dict) or "latency" not in row or "code" not in row:
            continue
        elapsed = latency_ms(row.get("latency"))
        ts = _time_ms(row.get("timestamp"))
        if elapsed is None:
            continue
        try:
            code = int(row.get("code") or 0)
        except (TypeError, ValueError):
            code = 0
        error = str(row.get("error") or "")
        ok = not error and 0 < code < 400
        rows.append(
            {
                "ts": (ts or 0) / 1000.0,
                "elapsed_ms": max(elapsed, 0),
                "code": code,
                "ok": ok,
            }
        )
    return rows


def main() -> int:
    if len(sys.argv) < 3:
        raise SystemExit("usage: report.py results.json report-dir")
    src = Path(sys.argv[1])
    report_dir = Path(sys.argv[2])
    rows = parse_jsonl(src)
    if not rows:
        raise SystemExit(f"STOP: artillery JSONL has no samples: {src}")
    elapsed = [row["elapsed_ms"] for row in rows]
    fails = sum(1 for row in rows if not row["ok"])
    total = len(rows)
    span = max(rows[-1]["ts"] - rows[0]["ts"], 1.0)
    p95 = _percentile(elapsed, 0.95)
    rate = total / span
    payload = {
        "metrics": {
            "http_req_duration": {"values": {"p(95)": p95}},
            "http_reqs": {"values": {"rate": rate, "count": total, "fails": fails}},
        }
    }
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "summary.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"p95 {int(round(p95))}ms")
    print(f"{rate:.1f} rps")
    print(f"{total}/{total} ({fails} failed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
