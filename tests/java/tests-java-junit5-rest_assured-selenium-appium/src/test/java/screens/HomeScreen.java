package screens;

import io.qameta.allure.Step;
import org.openqa.selenium.By;

public class HomeScreen extends BaseScreen {

    private final By welcomePanel = id("welcome-panel");
    private final By welcomeMessage = id("welcome-message");
    private final By logoutButton = id("logout-button");
    private final By deleteAccountButton = id("delete-account-button");
    private final By deleteConfirmButton = id("delete-confirm-button");
    private final By deleteCancelButton = id("delete-cancel-button");

    @Step("Welcome message is {expected}")
    public HomeScreen shouldHaveWelcomeMessage(String expected) {
        visible(welcomePanel);
        shouldHaveText(welcomeMessage, expected);
        return this;
    }

    @Step("Session panel offers logout and delete account")
    public HomeScreen shouldShowSessionActions() {
        visible(logoutButton);
        visible(deleteAccountButton);
        return this;
    }

    @Step("Click logout")
    public LoginScreen clickLogoutButton() {
        click(logoutButton);
        return new LoginScreen();
    }

    @Step("Click delete account and confirm")
    public LoginScreen clickDeleteAccountAndConfirm() {
        click(deleteAccountButton);
        click(deleteConfirmButton);
        return new LoginScreen();
    }

    @Step("Click delete account and cancel")
    public HomeScreen clickDeleteAccountAndCancel() {
        click(deleteAccountButton);
        click(deleteCancelButton);
        return this;
    }
}
