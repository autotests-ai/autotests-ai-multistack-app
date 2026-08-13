#!/usr/bin/env python
"""Serve the vanilla /stack/ board with host-nginx path rewrites (css/js under /stack/)."""

from __future__ import annotations

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class StackBoardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        raw = path.split("?", 1)[0]
        if raw.rstrip("/") == "/stack":
            raw = "/stack/index.html"
        elif raw.startswith("/stack/css/"):
            raw = "/css/" + raw[len("/stack/css/") :]
        elif raw.startswith("/stack/js/"):
            raw = "/js/" + raw[len("/stack/js/") :]
        elif raw.startswith("/stack/templates/"):
            raw = "/templates/" + raw[len("/stack/templates/") :]
        return super().translate_path(raw)


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9830
    httpd = ThreadingHTTPServer(("127.0.0.1", port), StackBoardHandler)
    httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
