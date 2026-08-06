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
}
