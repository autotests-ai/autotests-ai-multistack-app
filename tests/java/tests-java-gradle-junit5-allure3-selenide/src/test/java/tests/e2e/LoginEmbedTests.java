package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Authentication")
@Feature("Login embed")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Login embed")
class LoginEmbedTests extends TestBase {

    @Test
    @Tag("e2e")
    @Tag("mock")
    @DisplayName("Embedded header is visible on login page")
    void embeddedHeaderIsVisibleOnLoginPage() {
        loginPage.openPage()
                .shouldShowEmbeddedHeader()
                .shouldShowLoginForm()
                .shouldHaveFormTitle("Login Form");
    }
}
