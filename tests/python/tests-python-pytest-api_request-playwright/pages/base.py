from __future__ import annotations

from playwright.sync_api import Page

from api_client import login

AUTH_TOKEN_KEY_JS = r"""() => {
  const m = location.pathname.match(/\/(backend-[^/]+)\//);
  return m ? `authToken:${m[1]}` : 'authToken';
}"""


class BasePage:
    def __init__(self, page: Page, api) -> None:
        self.page = page
        self.api = api

    def _authenticate(self, username: str, password: str) -> str:
        return login(self.api, username, password)

    def _open_page_with_local_storage_token(self, path: str, token: str) -> None:
        self.page.goto("icons/qa-guru-logo.svg")
        self.page.evaluate(
            "([k, t]) => localStorage.setItem(k, t)", [self.auth_token_key(), token]
        )
        self.page.goto(path)

    def _wait_for_auth_token_to_be_cleared(self) -> None:
        self.page.wait_for_function(
            f"() => localStorage.getItem(({AUTH_TOKEN_KEY_JS})()) === null"
        )

    def auth_token_key(self) -> str:
        return self.page.evaluate(AUTH_TOKEN_KEY_JS)

    def auth_token(self) -> str | None:
        return self.page.evaluate("k => localStorage.getItem(k)", self.auth_token_key())
