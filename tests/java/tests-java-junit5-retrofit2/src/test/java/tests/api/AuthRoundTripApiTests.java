package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import api.Calls;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;

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

        var registered = Calls.execute(api.register(new RegisterRequest(username, password)));
        assertEquals(201, registered.code());
        assertNotNull(registered.body());
        assertEquals(username, registered.body().username());

        var loggedIn = Calls.execute(api.login(new LoginRequest(username, password)));
        assertEquals(200, loggedIn.code());
        assertNotNull(loggedIn.body());
        String token = loggedIn.body().token();

        var me = Calls.execute(api.me(bearer(token)));
        assertEquals(200, me.code());
        assertNotNull(me.body());
        assertEquals(username, me.body().username());

        assertEquals(204, Calls.execute(api.logout(bearer(token))).code());

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        var meAfterLogout = Calls.execute(api.me(bearer(token)));
        assertEquals(200, meAfterLogout.code());
        assertNotNull(meAfterLogout.body());
        assertEquals(username, meAfterLogout.body().username());

        assertEquals(204, Calls.execute(api.deleteMe(bearer(token))).code());

        // The token still verifies cryptographically, but the account is gone → 401.
        assertEquals(401, Calls.execute(api.me(bearer(token))).code());
    }
}
