package pages;

import api.AuthApiClient;
import helpers.Ui;
import io.qameta.allure.Step;
import org.openqa.selenium.WebElement;

public class HomePage extends BasePage<HomePage> {

    private static final String AUTH_TOKEN_KEY_JS =
            "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
                    + "return m ? 'authToken:' + m[1] : 'authToken';";

    private static final String DELETE_ACCOUNT_CONFIRM =
            "Delete this account? This cannot be undone.";

    private String authTokenKey() {
        return String.valueOf(Ui.js(AUTH_TOKEN_KEY_JS));
    }

    private void stubConfirm(boolean accepted) {
        Ui.js(
                "window.__deleteConfirm = null;"
                        + "(function(accepted) {"
                        + "  window.confirm = function(msg) {"
                        + "    window.__deleteConfirm = msg;"
                        + "    return accepted;"
                        + "  };"
                        + "})(arguments[0]);",
                accepted);
    }

    private void shouldHaveConfirmMessage() {
        Ui.waitUntil(driver -> DELETE_ACCOUNT_CONFIRM.equals(Ui.js("return window.__deleteConfirm;")));
    }

    @Step("Open home page")
    public HomePage openPage() {
        Ui.open("/");
        return shouldBeOpen();
    }

    @Step("Open home page with local storage authentication")
    public HomePage openPageWithLocalStorageAuthentication(String username, String password) {
        String token = AuthApiClient.login(username, password);
        Ui.open("/login");
        Ui.js(
                "localStorage.setItem(arguments[0], arguments[1]);",
                authTokenKey(),
                token
        );
        Ui.open("/");
        return shouldBeOpen();
    }

    @Step("Open home page with invalid local storage token")
    public HomePage openPageWithInvalidToken() {
        Ui.open("/login");
        Ui.js(
                "localStorage.setItem(arguments[0], arguments[1]);",
                authTokenKey(),
                "invalid-token"
        );
        Ui.open("/");
        return shouldBeOpen();
    }

    @Override
    @Step("Verify home page is open")
    public HomePage shouldBeOpen() {
        Ui.shouldBeVisible("multistack-layout");
        return this;
    }

    @Step("Verify home layout is mounted")
    public HomePage shouldShowLayout() {
        Ui.shouldBeVisible("multistack-layout");
        Ui.shouldBeVisible("items-list");
        return this;
    }

    @Step("Verify home layout and health are mounted")
    public HomePage shouldShowLayoutAndHealth() {
        Ui.shouldBeVisible("multistack-layout");
        Ui.shouldBeVisible("health-status");
        return this;
    }

    @Step("Home layout panel is visible")
    public WebElement layoutPanel() {
        return Ui.el("multistack-layout");
    }

    @Step("Welcome panel is visible")
    public WebElement welcomePanelElement() {
        return Ui.el("welcome-panel");
    }

    @Step("Verify welcome panel stays hidden")
    public HomePage shouldHideWelcomePanel() {
        Ui.shouldHaveAttribute("welcome-panel", "hidden", "");
        return this;
    }

    @Step("Verify auth token was cleared from localStorage")
    public HomePage shouldClearAuthToken() {
        Ui.waitUntil(driver -> Ui.js("return localStorage.getItem(arguments[0]);", authTokenKey()) == null);
        return this;
    }

    @Step("Verify health status contains: {textFragment}")
    public HomePage shouldShowHealthText(String textFragment) {
        Ui.shouldHaveText("health-status", textFragment);
        return this;
    }

    @Step("Verify items list contains: {textFragment}")
    public HomePage shouldShowItemText(String textFragment) {
        Ui.shouldHaveText("items-list", textFragment);
        return this;
    }

    @Step("Verify items panel shows a readable error: {textFragment}")
    public HomePage shouldShowItemsError(String textFragment) {
        Ui.shouldHaveText("items-list", textFragment);
        return this;
    }

    @Step("Verify health panel shows a readable error: {textFragment}")
    public HomePage shouldShowHealthError(String textFragment) {
        Ui.shouldHaveText("health-status", textFragment);
        return this;
    }

    @Step("Verify welcome message: {message}")
    public HomePage shouldHaveWelcomeMessage(String message) {
        Ui.shouldBeVisible("welcome-panel");
        Ui.shouldHaveText("welcome-message", message);
        return this;
    }

    @Step("Verify session panel offers logout and delete account")
    public HomePage shouldShowSessionActions() {
        Ui.shouldBeVisible("logout-button");
        Ui.shouldHaveText("logout-button", "Logout");
        Ui.shouldBeVisible("delete-account-button");
        Ui.shouldHaveText("delete-account-button", "Delete account");
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        Ui.click("logout-button");
        return new LoginPage();
    }

    @Step("Click delete account and confirm")
    public LoginPage clickDeleteAccountAndConfirm() {
        stubConfirm(true);
        Ui.click("delete-account-button");
        shouldHaveConfirmMessage();
        return new LoginPage();
    }

    @Step("Click delete account and cancel the confirm")
    public HomePage clickDeleteAccountAndCancel() {
        stubConfirm(false);
        Ui.click("delete-account-button");
        shouldHaveConfirmMessage();
        return this;
    }

    @Step("Verify auth token remains in localStorage")
    public HomePage shouldKeepAuthToken() {
        Ui.waitUntil(driver -> Ui.js("return localStorage.getItem(arguments[0]);", authTokenKey()) != null);
        return this;
    }
}
