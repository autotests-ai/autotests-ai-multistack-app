package tests.ui;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("ui")
@Epic("Authentication")
@Feature("Login form")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Login form")
class LoginFormTests extends TestBase {

    @Test
    @Tag("ui")
    @Tag("mock")
    @DisplayName("Login form fields and submit are visible")
    void loginFormFieldsAreVisible() {
        app.login.open().shouldShowLoginForm();
        assertThat(app.login.formTitle).containsText("Login Form");
    }
}
