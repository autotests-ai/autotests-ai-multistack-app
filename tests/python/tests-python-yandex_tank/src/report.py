"""Build Yandex.Tank HTML + k6-shaped summary.json from phantom phout."""
from __future__ import annotations

import html
import json
import math
import sys
from collections import Counter
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


def parse_phout(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.is_file():
        return rows
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t") if "\t" in line else line.split()
        if len(parts) < 12:
            continue
        try:
            ts = float(parts[0])
            interval_us = float(parts[2])
            net_code = int(float(parts[10]))
            proto_code = int(float(parts[11]))
        except (TypeError, ValueError):
            continue
        tag = parts[1] or "request"
        ok = net_code == 0 and 0 < proto_code < 400
        rows.append(
            {
                "ts": ts,
                "tag": tag,
                "elapsed_ms": max(interval_us, 0) / 1000.0,
                "net_code": net_code,
                "proto_code": proto_code,
                "ok": ok,
            }
        )
    return rows


def main() -> int:
    if len(sys.argv) < 4:
        raise SystemExit("usage: report.py phout.html.dir summary.json")
    phout = Path(sys.argv[1])
    report_dir = Path(sys.argv[2])
    summary_path = Path(sys.argv[3])
    rows = parse_phout(phout)
    if not rows:
        raise SystemExit(f"STOP: phout has no samples: {phout}")
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
    summary_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
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
  <title>Yandex.Tank · AuthApi</title>
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
  <h1>Yandex.Tank</h1>
  <p class="meta">phantom phout · health → login → me → items → logout</p>
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
