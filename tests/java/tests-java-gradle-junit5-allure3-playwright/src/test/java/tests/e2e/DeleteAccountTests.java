package tests.e2e;

import annotations.Layer;
import helpers.User;
import helpers.UserBuilder;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Layer("e2e")
@Epic("Authentication")
@Feature("Delete account")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Delete account")
class DeleteAccountTests extends TestBase {

    @Test
    @Tag("e2e")
    @Tag("positive")
    @DisplayName("User can delete the account from home")
    void shouldDeleteAccount() {
        User user = new UserBuilder().withUsername().withPassword().build();
        app.register.open().signup(user.username(), user.password());
        assertThat(app.home.welcomeMessage).containsText(user.welcomeMessage());
        app.home.clickDeleteAccountAndConfirm();
        assertThat(app.login.formTitle).containsText("Login Form");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Cancelling the confirm keeps the session")
    void cancellingConfirmKeepsSession() {
        User user = new UserBuilder().withUsername().withPassword().build();
        app.register.open().signup(user.username(), user.password());
        assertThat(app.home.welcomeMessage).containsText(user.welcomeMessage());
        app.home.clickDeleteAccountAndCancel();
        assertThat(app.home.welcomeMessage).containsText(user.welcomeMessage());
        assertNotNull(app.home.authToken());
        app.home.clickDeleteAccountAndConfirm();
        assertThat(app.login.formTitle).containsText("Login Form");
    }
}
