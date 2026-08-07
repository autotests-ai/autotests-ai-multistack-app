package tests.manual;

import tests.AllureMeta;
import annotations.Layer;
import annotations.Manual;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.qameta.allure.Allure.step;

/**
 * Manual cases stored in code (canon — see tests/LAYERS.md).
 * Checklist steps for humans; {@link annotations.Manual} marks them for TestOps.
 */
@Layer("manual")
@Epic("Exploratory")
@Feature("Manual checklist")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Exploratory manual")
class ExploratoryManualTests extends AllureMeta {

    @Test
    @Manual
    @Tag("manual")
    @DisplayName("Auth happy path across login → home → logout")
    void authHappyPathChecklist() {
        step("Open /login and sign in as seeded user1 / password1");
        step("Confirm welcome panel shows Welcome, user1!");
        step("Logout and land on /login with empty session");
    }

    @Test
    @Manual
    @Tag("manual")
    @DisplayName("Items catalogue: content, order and resilience charter")
    void itemsCatalogueCharter() {
        step("Open / and let health + items load");
        step("Check items render Alpha, Beta, Gamma in stable id order with descriptions");
        step("Narrow the viewport to 390px — cards stack, nothing overflows");
        step("Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page");
    }

    @Test
    @Manual
    @Tag("manual")
    @DisplayName("Session and token edge cases charter")
    void sessionTokenCharter() {
        step("Sign in, reload — welcome survives (token in localStorage)");
        step("Replace the stored token with garbage in devtools, reload — session is cleared, no crash");
        step("Sign in in a second tab, logout in the first — observe what the second tab shows on next action");
        step("Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page");
    }
}
