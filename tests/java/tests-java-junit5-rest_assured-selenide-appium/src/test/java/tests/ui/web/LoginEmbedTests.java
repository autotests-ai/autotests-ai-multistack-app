package tests.ui.web;

import tests.WebTestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("ui")
@Epic("Authentication")
@Feature("Login embed")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Login embed")
class LoginEmbedTests extends WebTestBase {

    @Test
    @Tag("ui")
    @DisplayName("Embedded header is visible on login page")
    void embeddedHeaderIsVisibleOnLoginPage() {
        loginPage.openPage()
                .shouldHaveFormTitle("Login Form")
                .header.shouldShowEmbeddedHeader();
    }
}
