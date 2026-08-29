package tests.e2e;

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

@Layer("e2e")
@Epic("Authentication")
@Feature("Register form")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Register form")
class RegisterFormTests extends TestBase {

    @Test
    @Tag("e2e")
    @Tag("mock")
    @DisplayName("Register form fields and submit are visible")
    void registerFormFieldsAreVisible() {
        app.register.open().shouldShowRegisterForm();
        assertThat(app.register.formTitle).containsText("Register");
    }
}
