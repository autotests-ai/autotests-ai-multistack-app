"""Account lifecycle across separate HTTP requests — java AuthRoundTripApiTests."""

from __future__ import annotations

import allure
import pytest

from api_client import request, username

pytestmark = pytest.mark.api


@allure.epic("Authentication")
@allure.feature("Account lifecycle")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Auth account lifecycle on deployed stand")
class TestAuthRoundTripApi:
    @allure.title("register → login → me → logout (stateless: token survives) → delete → me is 401")
    def test_account_lifecycle_round_trip(self, config):
        name = username()
        password = "password123"

        created = request(
            config, "POST", "/api/auth/register", json={"username": name, "password": password}
        )
        assert created.status_code == 201
        assert created.json()["username"] == name

        logged_in = request(
            config, "POST", "/api/auth/login", json={"username": name, "password": password}
        )
        assert logged_in.status_code == 200
        token = logged_in.json()["token"]

        me = request(config, "GET", "/api/auth/me", token=token)
        assert me.status_code == 200
        assert me.json()["username"] == name

        logout = request(config, "POST", "/api/auth/logout", token=token)
        assert logout.status_code == 204

        # Stateless JWT: logout does not invalidate the token server-side — by design.
        still_me = request(config, "GET", "/api/auth/me", token=token)
        assert still_me.status_code == 200
        assert still_me.json()["username"] == name

        deleted = request(config, "DELETE", "/api/auth/me", token=token)
        assert deleted.status_code == 204

        gone = request(config, "GET", "/api/auth/me", token=token)
        assert gone.status_code == 401
