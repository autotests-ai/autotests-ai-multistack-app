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
    @DisplayName("Stack switcher opens another backend/frontend combo")
    void stackSwitcherChecklist() {
        step("Open /stack/ and wait for matrix boards");
        step("Pick another active backend × frontend pair");
        step("Confirm URL and current-pair badge match the selected combo");
    }
}
