"""tokens.css resolver — mirrors Java TokensCss."""

from __future__ import annotations

import re
from pathlib import Path

_ROOT_BLOCK = re.compile(r":root\s*\{([^}]+)\}", re.DOTALL)
_TOKEN = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")

_MODULE_ROOT = Path(__file__).resolve().parent
_APP_ROOT = (_MODULE_ROOT / ".." / ".." / "..").resolve()


def default_tokens_path() -> Path:
    return resolve_from_app_root(_APP_ROOT)


def resolve_from_app_root(app_root: Path) -> Path:
    return first_existing(*tokens_css_candidates(app_root))


def first_existing(*candidates: Path) -> Path:
    fallback = candidates[-1].resolve()
    for candidate in candidates:
        abs_path = candidate.resolve()
        if abs_path.exists():
            return abs_path
        fallback = abs_path
    return fallback


def parse_root_tokens(css_file: Path) -> dict[str, str]:
    css = css_file.read_text(encoding="utf-8")
    match = _ROOT_BLOCK.search(css)
    if not match:
        raise ValueError(f":root block not found in {css_file}")
    tokens: dict[str, str] = {}
    for token, value in _TOKEN.findall(match.group(1)):
        tokens[token] = value.strip()
    return tokens


def tokens_css_candidates(app_root: Path) -> list[Path]:
    candidates = [hub_tokens(app_root)]
    _append_vendor_tokens(app_root / "frontend", candidates)
    return candidates


def hub_tokens(app_root: Path) -> Path:
    return app_root / "frontend" / "_shared" / "frontend-javascript-app" / "css" / "tokens.css"


def _append_vendor_tokens(frontend_root: Path, out: list[Path]) -> None:
    if not frontend_root.is_dir():
        return
    for lang in sorted(p for p in frontend_root.iterdir() if p.is_dir()):
        if not _is_product_language_dir(lang):
            continue
        for cell in sorted(p for p in lang.iterdir() if p.is_dir()):
            if cell.name.startswith("."):
                continue
            out.append(cell / "vendor" / "ds" / "css" / "tokens.css")
            out.append(cell / "vendor" / "frontend-javascript-app" / "css" / "tokens.css")


def _is_product_language_dir(path: Path) -> bool:
    name = path.name
    return not name.startswith(".") and not name.startswith("_") and name not in {"scripts", "node_modules"}
