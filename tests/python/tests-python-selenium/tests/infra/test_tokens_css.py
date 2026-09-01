"""TokensCss analog — java TokensCssTest (infra-frontend)."""

from __future__ import annotations

from pathlib import Path

import allure
import pytest

from tokens_css import default_tokens_path, first_existing, parse_root_tokens, resolve_from_app_root

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]


def _write_tokens(file: Path) -> Path:
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(":root { --x: 1px; }", encoding="utf-8")
    return file


@allure.epic("Test infra")
@allure.feature("Tokens CSS")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("TokensCss")
class TestTokensCss:
    @pytest.mark.parametrize(
        "token,expected",
        [
            ("--control-height-md", "36px"),
            ("--icon-size-md", "18px"),
            ("--input-min-width", "200px"),
            ("--header-height", "40px"),
        ],
    )
    def test_tokens_match_component_sizes_canon(self, token: str, expected: str):
        tokens = parse_root_tokens(default_tokens_path())
        assert token in tokens, f"Missing token: {token}"
        assert tokens[token] == expected

    def test_default_tokens_path_resolves_existing_file(self):
        assert default_tokens_path().is_file()

    def test_first_existing_returns_the_first_path_that_exists(self, tmp_path: Path):
        missing = tmp_path / "missing.css"
        hit = tmp_path / "hit.css"
        later = tmp_path / "later.css"
        hit.write_text(":root { --x: 1px; }", encoding="utf-8")
        later.write_text(":root { --y: 2px; }", encoding="utf-8")
        assert first_existing(missing, hit, later) == hit.resolve()

    def test_first_existing_returns_last_when_none_exist(self, tmp_path: Path):
        missing = tmp_path / "missing.css"
        fallback = tmp_path / "fallback.css"
        assert first_existing(missing, fallback) == fallback.resolve()

    def test_resolve_from_app_root_prefers_hub(self, tmp_path: Path):
        hub = _write_tokens(
            tmp_path / "frontend" / "_shared" / "frontend-javascript-app" / "css" / "tokens.css"
        )
        _write_tokens(
            tmp_path
            / "frontend"
            / "javascript"
            / "frontend-javascript-vue"
            / "vendor"
            / "ds"
            / "css"
            / "tokens.css"
        )
        assert resolve_from_app_root(tmp_path) == hub.resolve()

    def test_resolve_from_app_root_finds_vue_vendor_when_hub_missing(self, tmp_path: Path):
        vue = _write_tokens(
            tmp_path
            / "frontend"
            / "javascript"
            / "frontend-javascript-vue"
            / "vendor"
            / "ds"
            / "css"
            / "tokens.css"
        )
        assert resolve_from_app_root(tmp_path) == vue.resolve()

    def test_resolve_from_app_root_skips_non_product_frontend_dirs(self, tmp_path: Path):
        _write_tokens(
            tmp_path / "frontend" / "scripts" / "not-a-cell" / "vendor" / "ds" / "css" / "tokens.css"
        )
        _write_tokens(
            tmp_path / "frontend" / ".github" / "workflows" / "vendor" / "ds" / "css" / "tokens.css"
        )
        _write_tokens(
            tmp_path / "frontend" / "node_modules" / "pkg" / "vendor" / "ds" / "css" / "tokens.css"
        )
        _write_tokens(
            tmp_path / "frontend" / "javascript" / ".github" / "vendor" / "ds" / "css" / "tokens.css"
        )
        vue = _write_tokens(
            tmp_path
            / "frontend"
            / "javascript"
            / "frontend-javascript-vue"
            / "vendor"
            / "ds"
            / "css"
            / "tokens.css"
        )
        assert resolve_from_app_root(tmp_path) == vue.resolve()

    def test_resolve_from_app_root_falls_back_to_vendored_app(self, tmp_path: Path):
        baked = _write_tokens(
            tmp_path
            / "frontend"
            / "javascript"
            / "frontend-javascript-vue"
            / "vendor"
            / "frontend-javascript-app"
            / "css"
            / "tokens.css"
        )
        assert resolve_from_app_root(tmp_path) == baked.resolve()

    def test_resolve_from_app_root_falls_back_to_hub_when_frontend_missing(self, tmp_path: Path):
        hub = tmp_path / "frontend" / "_shared" / "frontend-javascript-app" / "css" / "tokens.css"
        assert resolve_from_app_root(tmp_path) == hub.resolve()

    def test_parse_root_tokens_rejects_missing_root_block(self, tmp_path: Path):
        css = tmp_path / "tokens-invalid.css"
        css.write_text("body { color: red; }", encoding="utf-8")
        with pytest.raises(ValueError, match=":root block not found"):
            parse_root_tokens(css)
