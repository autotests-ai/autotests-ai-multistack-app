package pages;

import helpers.NativeInput;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class HomeScreen {

    @Step("Welcome message is {expected}")
    public HomeScreen shouldHaveWelcomeMessage(String expected) {
        $(id("welcome-panel")).shouldBe(visible);
        $(id("welcome-message")).shouldHave(text(expected));
        return this;
    }

    @Step("Session panel offers logout and delete account")
    public HomeScreen shouldShowSessionActions() {
        $(id("logout-button")).shouldBe(visible);
        $(id("delete-account-button")).shouldBe(visible);
        return this;
    }

    @Step("Click logout")
    public LoginScreen clickLogoutButton() {
        NativeInput.hideKeyboard();
        $(id("logout-button")).shouldBe(visible).click();
        return new LoginScreen();
    }

    @Step("Click delete account and confirm")
    public LoginScreen clickDeleteAccountAndConfirm() {
        NativeInput.hideKeyboard();
        $(id("delete-account-button")).shouldBe(visible).click();
        $(id("delete-confirm-button")).shouldBe(visible).click();
        return new LoginScreen();
    }

    @Step("Click delete account and cancel")
    public HomeScreen clickDeleteAccountAndCancel() {
        NativeInput.hideKeyboard();
        $(id("delete-account-button")).shouldBe(visible).click();
        $(id("delete-cancel-button")).shouldBe(visible).click();
        return this;
    }
}
