package pages;

import com.codeborne.selenide.SelenideElement;
import helpers.NativeInput;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static helpers.TestIds.id;

public class HomeScreen {

    private final SelenideElement welcomePanel = $(id("welcome-panel"));
    private final SelenideElement welcomeMessage = $(id("welcome-message"));
    private final SelenideElement logoutButton = $(id("logout-button"));
    private final SelenideElement deleteAccountButton = $(id("delete-account-button"));
    private final SelenideElement deleteConfirmButton = $(id("delete-confirm-button"));
    private final SelenideElement deleteCancelButton = $(id("delete-cancel-button"));

    @Step("Welcome message is {expected}")
    public HomeScreen shouldHaveWelcomeMessage(String expected) {
        welcomePanel.shouldBe(visible);
        welcomeMessage.shouldHave(text(expected));
        return this;
    }

    @Step("Session panel offers logout and delete account")
    public HomeScreen shouldShowSessionActions() {
        logoutButton.shouldBe(visible);
        deleteAccountButton.shouldBe(visible);
        return this;
    }

    @Step("Click logout")
    public LoginScreen clickLogoutButton() {
        NativeInput.hideKeyboard();
        logoutButton.shouldBe(visible).click();
        return new LoginScreen();
    }

    @Step("Click delete account and confirm")
    public LoginScreen clickDeleteAccountAndConfirm() {
        NativeInput.hideKeyboard();
        deleteAccountButton.shouldBe(visible).click();
        deleteConfirmButton.shouldBe(visible).click();
        return new LoginScreen();
    }

    @Step("Click delete account and cancel")
    public HomeScreen clickDeleteAccountAndCancel() {
        NativeInput.hideKeyboard();
        deleteAccountButton.shouldBe(visible).click();
        deleteCancelButton.shouldBe(visible).click();
        return this;
    }
}
