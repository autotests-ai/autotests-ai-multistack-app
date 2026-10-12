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
@Feature("Login form")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Login form mount")
class LoginFormTests extends WebTestBase {

    @Test
    @Tag("ui")
    @DisplayName("Login form fields and submit are visible")
    void loginFormIsMounted() {
        loginPage.openPage()
                .shouldShowLoginForm()
                .shouldHaveFormTitle("Login Form");
    }
}
