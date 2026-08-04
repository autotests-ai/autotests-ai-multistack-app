package tests.integration;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import pages.RegisterPage;

@Layer("integration")
@Epic("Authentication")
@Feature("Register form")
@DisplayName("Register form mount")
class RegisterFormTests extends TestBase {

    private final RegisterPage registerPage = new RegisterPage();

    @Test
    @Tag("mount")
    @DisplayName("Register form fields and submit are visible")
    void registerFormIsMounted() {
        registerPage.openPage()
                .shouldShowRegisterForm()
                .shouldHaveFormTitle("Register");
    }
}
