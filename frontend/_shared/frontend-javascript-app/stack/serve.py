#!/usr/bin/env python
"""Serve the vanilla /stack/ board with host-nginx path rewrites (css/js under /stack/).

Bare `/stack/` 301s to the CI default pair — same contract as prod host nginx.
"""

from __future__ import annotations

import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_STACK = "/stack/backend-java-spring/frontend-typescript-react/"
PAIR_RE_PREFIX = "/stack/"


class StackBoardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _redirect(self, location: str) -> None:
        self.send_response(301)
        self.send_header("Location", location)
        self.end_headers()

    def _redirect_target(self) -> str | None:
        raw = self.path.split("?", 1)[0]
        if raw.rstrip("/") == "/stack" or raw == "/stack/index.html":
            return DEFAULT_STACK
        if raw.rstrip("/") == "/stack/login":
            return DEFAULT_STACK + "login"
        if raw.rstrip("/") == "/stack/register":
            return DEFAULT_STACK + "register"
        pair_stack = re.fullmatch(
            r"(/stack/backend-[^/]+/frontend-[^/]+)/stack/?",
            raw,
        )
        if pair_stack:
            return pair_stack.group(1) + "/"
        return None

    def do_HEAD(self) -> None:  # noqa: N802
        target = self._redirect_target()
        if target:
            self._redirect(target)
            return
        super().do_HEAD()

    def do_GET(self) -> None:  # noqa: N802
        target = self._redirect_target()
        if target:
            self._redirect(target)
            return
        super().do_GET()

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
        elif raw.startswith(PAIR_RE_PREFIX):
            rest = raw[len(PAIR_RE_PREFIX) :]
            parts = [p for p in rest.split("/") if p]
            if (
                len(parts) >= 2
                and parts[0].startswith("backend-")
                and parts[1].startswith("frontend-")
                and (len(parts) == 2 or parts[2] in ("stack", "index.html"))
            ):
                raw = "/stack/index.html"
        return super().translate_path(raw)


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9830
    httpd = ThreadingHTTPServer(("127.0.0.1", port), StackBoardHandler)
    httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
