"""HTTP contract of /api/auth/* — same questions as java AuthApiTests."""

from __future__ import annotations

import allure
import pytest

from api_client import WRONG_CREDENTIALS_MESSAGE, delete_account, login, register, request, username
from schema_assert import assert_schema

pytestmark = pytest.mark.api


@allure.epic("Authentication")
@allure.feature("Authentication")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Auth API")
class TestAuthApi:
    @allure.title("POST /api/auth/login returns the auth contract for a seeded user")
    @pytest.mark.smoke
    def test_login_with_valid_credentials(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "user1", "password": "password1"}
        )
        assert response.status_code == 200
        body = response.json()
        assert_schema(body, "auth-response.json")
        assert body["username"] == "user1"
        assert body["redirectUrl"] == "/"

    @allure.title("POST /api/auth/login rejects a wrong password with 401")
    def test_login_with_invalid_password(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/login",
            json={"username": "user1", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        body = response.json()
        assert_schema(body, "error.json")
        assert body["message"] == WRONG_CREDENTIALS_MESSAGE

    @allure.title("POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")
    def test_login_with_unknown_username(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/login",
            json={"username": username(), "password": "password123"},
        )
        assert response.status_code == 401
        assert response.json()["message"] == WRONG_CREDENTIALS_MESSAGE

    @allure.title("POST /api/auth/login joins both field errors into one 400 message")
    def test_login_rejects_empty_credentials(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "", "password": ""}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        message = body["message"]
        assert "username" in message
        assert "password" in message
        assert "; " in message

    @allure.title("POST /api/auth/login rejects a short username with 400 and a field message")
    @pytest.mark.negative
    def test_login_rejects_short_username(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "ab", "password": "password1"}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "username" in body["message"]

    @allure.title("POST /api/auth/login rejects a short password with 400 and a field message")
    @pytest.mark.negative
    def test_login_rejects_short_password(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "user1", "password": "123"}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "password" in body["message"]

    @allure.title("POST /api/auth/login rejects an empty username with 400")
    @pytest.mark.negative
    def test_login_rejects_empty_username(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "", "password": "password1"}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "username" in body["message"]

    @allure.title("POST /api/auth/login rejects an empty password with 400")
    @pytest.mark.negative
    def test_login_rejects_empty_password(self, config):
        response = request(
            config, "POST", "/api/auth/login", json={"username": "user1", "password": ""}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "password" in body["message"]

    @allure.title("POST /api/auth/login answers a malformed JSON body with 400, not 401")
    @pytest.mark.negative
    def test_login_rejects_malformed_json(self, config):
        response = request(config, "POST", "/api/auth/login", data="not json")
        assert response.status_code == 400
        assert response.json()["message"] == "Request body is not valid JSON"

    @allure.title("POST /api/auth/register creates a user, returns the auth contract, and cleans up")
    def test_register_new_user(self, config):
        name = username()
        response = request(
            config, "POST", "/api/auth/register", json={"username": name, "password": "password123"}
        )
        assert response.status_code == 201
        body = response.json()
        assert_schema(body, "auth-response.json")
        assert body["username"] == name
        assert body["redirectUrl"] == "/"
        delete_account(config, body["token"])

    @allure.title("POST /api/auth/register rejects a duplicate username with 409")
    def test_register_duplicate_username(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/register",
            json={"username": "user1", "password": "password123"},
        )
        assert response.status_code == 409
        body = response.json()
        assert_schema(body, "error.json")
        assert body["message"] == "Username already taken"

    @allure.title("POST /api/auth/register rejects a short password with 400 and a field message")
    def test_register_rejects_short_password(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/register",
            json={"username": "shortuser", "password": "abc"},
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "password" in body["message"]

    @allure.title("POST /api/auth/register rejects a short username with 400 and a field message")
    def test_register_rejects_short_username(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/register",
            json={"username": "ab", "password": "password123"},
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "username" in body["message"]

    @allure.title("POST /api/auth/register rejects an empty username with 400")
    def test_register_rejects_empty_username(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/register",
            json={"username": "", "password": "password123"},
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "username" in body["message"]

    @allure.title("POST /api/auth/register rejects an empty password with 400")
    def test_register_rejects_empty_password(self, config):
        response = request(
            config,
            "POST",
            "/api/auth/register",
            json={"username": "newuser", "password": ""},
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        assert "password" in body["message"]

    @allure.title("POST /api/auth/register joins both field errors into one 400 message")
    def test_register_rejects_empty_credentials(self, config):
        response = request(
            config, "POST", "/api/auth/register", json={"username": "", "password": ""}
        )
        assert response.status_code == 400
        body = response.json()
        assert_schema(body, "error.json")
        message = body["message"]
        assert "username" in message
        assert "password" in message

    @allure.title("POST /api/auth/register answers a malformed JSON body with 400, not 401")
    def test_register_rejects_malformed_json(self, config):
        response = request(config, "POST", "/api/auth/register", data="not json")
        assert response.status_code == 400
        assert response.json()["message"] == "Request body is not valid JSON"

    @allure.title("GET /api/auth/me returns the profile contract for a bearer token")
    def test_profile_with_bearer_token(self, config):
        token = login(config, "user1", "password1")
        response = request(config, "GET", "/api/auth/me", token=token)
        assert response.status_code == 200
        body = response.json()
        assert_schema(body, "profile.json")
        assert body["username"] == "user1"

    @allure.title("GET /api/auth/me without a token returns 401")
    def test_profile_without_token(self, config):
        response = request(config, "GET", "/api/auth/me")
        assert response.status_code == 401

    @allure.title("GET /api/auth/me with a garbage token returns 401")
    def test_profile_with_garbage_token(self, config):
        response = request(config, "GET", "/api/auth/me", token="not-a-jwt")
        assert response.status_code == 401

    @allure.title("POST /api/auth/logout returns 204")
    def test_logout_returns_no_content(self, config):
        response = request(config, "POST", "/api/auth/logout")
        assert response.status_code == 204

    @allure.title("DELETE /api/auth/me without a token returns 401")
    @pytest.mark.negative
    def test_delete_without_token(self, config):
        response = request(config, "DELETE", "/api/auth/me")
        assert response.status_code == 401

    @allure.title("DELETE /api/auth/me with a garbage token returns 401")
    @pytest.mark.negative
    def test_delete_with_garbage_token(self, config):
        response = request(config, "DELETE", "/api/auth/me", token="not-a-jwt")
        assert response.status_code == 401

    @allure.title("DELETE /api/auth/me removes the account: repeated login is rejected")
    def test_delete_removes_account(self, config):
        name = username()
        token = register(config, name, "password123")
        delete_account(config, token)
        response = request(
            config, "POST", "/api/auth/login", json={"username": name, "password": "password123"}
        )
        assert response.status_code == 401
        assert response.json()["message"] == WRONG_CREDENTIALS_MESSAGE

    @allure.title("unmapped /api/* path requires authentication (security catch-all)")
    def test_unmapped_api_path_requires_authentication(self, config):
        response = request(config, "GET", "/api/nope")
        assert response.status_code == 401
