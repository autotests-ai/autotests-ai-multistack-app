"""Build wrk HTML + k6-shaped summary.json from vegeta-compatible JSONL."""
from __future__ import annotations

import html
import json
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


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


def tag_for(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    if path.endswith("/api/health"):
        return "health"
    if path.endswith("/api/auth/login"):
        return "login"
    if path.endswith("/api/auth/me"):
        return "me"
    if path.endswith("/api/items"):
        return "items"
    if path.endswith("/api/auth/logout"):
        return "logout"
    return path.rsplit("/", 1)[-1] or "request"


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
                "tag": tag_for(str(row.get("url") or "")),
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
        raise SystemExit(f"STOP: wrk JSONL has no samples: {src}")
    elapsed = [row["elapsed_ms"] for row in rows]
    fails = sum(1 for row in rows if not row["ok"])
    total = len(rows)
    span = max(rows[-1]["ts"] - rows[0]["ts"], 1.0)
    p95 = _percentile(elapsed, 0.95)
    rate = total / span
    tags = Counter(row["tag"] for row in rows)
    fail_tags = Counter(row["tag"] for row in rows if not row["ok"])
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
    rows_html = []
    for tag, count in sorted(tags.items()):
        rows_html.append(
            f"<tr><td>{html.escape(tag)}</td><td>{count}</td><td>{fail_tags.get(tag, 0)}</td></tr>"
        )
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>wrk · AuthApi</title>
  <style>
    body {{ font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #111; }}
    h1 {{ margin-bottom: 0.25rem; }}
    .meta {{ color: #444; margin-bottom: 1.5rem; }}
    table {{ border-collapse: collapse; }}
    th, td {{ border: 1px solid #ccc; padding: 0.4rem 0.7rem; text-align: left; }}
    th {{ background: #f4f4f4; }}
  </style>
</head>
<body>
  <h1>wrk</h1>
  <p class="meta">wg/wrk JSONL · health → me → items → logout</p>
  <p><strong>p95 {int(round(p95))}ms</strong> · <strong>{rate:.1f} rps</strong> · {total}/{total} ({fails} failed)</p>
  <table>
    <thead><tr><th>tag</th><th>count</th><th>failed</th></tr></thead>
    <tbody>
      {''.join(rows_html)}
    </tbody>
  </table>
</body>
</html>
"""
    (report_dir / "index.html").write_text(page, encoding="utf-8")
    print(f"p95 {int(round(p95))}ms")
    print(f"{rate:.1f} rps")
    print(f"{total}/{total} ({fails} failed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
