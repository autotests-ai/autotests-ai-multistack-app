package pages;

import com.codeborne.selenide.SelenideElement;
import io.appium.java_client.AppiumBy;
import io.qameta.allure.Step;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

public class HomeScreen {

    private final SelenideElement welcomePanel = $(AppiumBy.accessibilityId("welcome-panel"));
    private final SelenideElement welcomeMessage = $(AppiumBy.accessibilityId("welcome-message"));
    private final SelenideElement logoutButton = $(AppiumBy.accessibilityId("logout-button"));
    private final SelenideElement deleteAccountButton = $(AppiumBy.accessibilityId("delete-account-button"));
    private final SelenideElement deleteConfirmButton = $(AppiumBy.accessibilityId("delete-confirm-button"));
    private final SelenideElement deleteCancelButton = $(AppiumBy.accessibilityId("delete-cancel-button"));

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
        logoutButton.click();
        return new LoginScreen();
    }

    @Step("Click delete account and confirm")
    public LoginScreen clickDeleteAccountAndConfirm() {
        deleteAccountButton.click();
        deleteConfirmButton.click();
        return new LoginScreen();
    }

    @Step("Click delete account and cancel")
    public HomeScreen clickDeleteAccountAndCancel() {
        deleteAccountButton.click();
        deleteCancelButton.click();
        return this;
    }
}
