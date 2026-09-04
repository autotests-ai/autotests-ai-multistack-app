package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.HttpResult;
import api.PlaywrightHttp;
import api.model.LoginRequest;
import api.model.RegisterRequest;
import helpers.DataFaker;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Layer("api")
@Epic("Authentication")
@Feature("Account lifecycle")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Auth account lifecycle on deployed stand")
class AuthRoundTripApiTests extends ApiTestBase {

    /**
     * Full account lifecycle across separate HTTP requests — proves DB and JWT are wired
     * together on the deployed stand, and documents that logout is stateless: the JWT keeps
     * working until the account itself is gone. Deletes the user it registers, so the stand
     * does not accumulate test accounts.
     */
    @Test
    @Tag("api")
    @DisplayName("register → login → me → logout (stateless: token survives) → delete → me is 401")
    void accountLifecycleRoundTrip() {
        String username = DataFaker.username();
        String password = "password123";

        HttpResult registered = PlaywrightHttp.request(
                "POST", "/api/auth/register", new RegisterRequest(username, password));
        assertEquals(201, registered.status(), registered.body());
        assertEquals(username, registered.text("username"));

        HttpResult login = PlaywrightHttp.request(
                "POST", "/api/auth/login", new LoginRequest(username, password));
        assertEquals(200, login.status(), login.body());
        String token = login.text("token");

        HttpResult me = PlaywrightHttp.request("GET", "/api/auth/me", token);
        assertEquals(200, me.status(), me.body());
        assertEquals(username, me.text("username"));

        HttpResult logout = PlaywrightHttp.request("POST", "/api/auth/logout", token);
        assertEquals(204, logout.status(), logout.body());

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        HttpResult meAfterLogout = PlaywrightHttp.request("GET", "/api/auth/me", token);
        assertEquals(200, meAfterLogout.status(), meAfterLogout.body());
        assertEquals(username, meAfterLogout.text("username"));

        HttpResult deleted = PlaywrightHttp.request("DELETE", "/api/auth/me", token);
        assertEquals(204, deleted.status(), deleted.body());

        // The token still verifies cryptographically, but the account is gone → 401.
        HttpResult meAfterDelete = PlaywrightHttp.request("GET", "/api/auth/me", token);
        assertEquals(401, meAfterDelete.status(), meAfterDelete.body());
    }
}
