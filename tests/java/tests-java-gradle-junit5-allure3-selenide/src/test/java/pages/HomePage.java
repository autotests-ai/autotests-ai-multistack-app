package pages;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.Wait;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.refresh;

import api.AuthApiClient;
import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

public class HomePage {

    /** Mirrors frontend authTokenStorageKey (backend-scoped on matrix paths). */
    private static final String AUTH_TOKEN_KEY_JS =
            "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
                    + "return m ? 'authToken:' + m[1] : 'authToken';";

    /** Mirrors frontend DELETE_ACCOUNT_CONFIRM. */
    private static final String DELETE_ACCOUNT_CONFIRM =
            "Delete this account? This cannot be undone.";

    private final SelenideElement layout = $("[data-testid='multistack-layout']");
    private final SelenideElement healthStatus = $("[data-testid='health-status']");
    private final SelenideElement itemsList = $("[data-testid='items-list']");
    private final SelenideElement welcomeMessage = $("[data-testid='welcome-message']");
    private final SelenideElement logoutButton = $("[data-testid='logout-button']");
    private final SelenideElement deleteAccountButton = $("[data-testid='delete-account-button']");
    private final SelenideElement welcomePanel = $("[data-testid='welcome-panel']");
    private final SelenideElement header = $("[data-testid='header']");

    private String authTokenKey() {
        return executeJavaScript(AUTH_TOKEN_KEY_JS);
    }

    /** Mirrors RTL {@code vi.spyOn(window, 'confirm').mockReturnValue(accepted)}. */
    private void stubConfirm(boolean accepted) {
        executeJavaScript(
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
        Wait().until(driver -> DELETE_ACCOUNT_CONFIRM.equals(
                executeJavaScript("return window.__deleteConfirm;")));
    }

    @Step("Open home page")
    public HomePage openPage() {
        open("/");
        return shouldBeOpen();
    }

    @Step("Reload current page")
    public HomePage reloadPage() {
        refresh();
        return shouldBeOpen();
    }

    @Step("Open home page with local storage authentication")
    public HomePage openPageWithLocalStorageAuthentication(String username, String password) {
        String token = AuthApiClient.login(username, password);

        open("/login");
        executeJavaScript(
                "localStorage.setItem(arguments[0], arguments[1]);",
                authTokenKey(),
                token
        );
        open("/");
        return shouldBeOpen();
    }

    @Step("Open home page with invalid local storage token")
    public HomePage openPageWithInvalidToken() {
        open("/login");
        executeJavaScript(
                "localStorage.setItem(arguments[0], arguments[1]);",
                authTokenKey(),
                "invalid-token"
        );
        open("/");
        return shouldBeOpen();
    }

    @Step("Verify home page is open")
    public HomePage shouldBeOpen() {
        layout.shouldBe(visible);
        return this;
    }

    @Step("Verify home layout is mounted")
    public HomePage shouldShowLayout() {
        layout.shouldBe(visible);
        itemsList.shouldBe(visible);
        return this;
    }

    @Step("Verify home layout and health are mounted")
    public HomePage shouldShowLayoutAndHealth() {
        layout.shouldBe(visible);
        healthStatus.shouldBe(visible);
        return this;
    }

    @Step("Home layout panel is visible")
    public SelenideElement layoutPanel() {
        return layout.shouldBe(visible);
    }

    @Step("Welcome panel is visible")
    public SelenideElement welcomePanelElement() {
        return welcomePanel.shouldBe(visible);
    }

    @Step("Verify embedded header is mounted")
    public HomePage shouldShowEmbeddedHeader() {
        header.shouldBe(visible);
        return this;
    }

    @Step("Verify welcome panel stays hidden")
    public HomePage shouldHideWelcomePanel() {
        // Panel uses the HTML hidden attribute (welcome === null); remote Chrome may still report isDisplayed().
        welcomePanel.shouldHave(attribute("hidden"));
        return this;
    }

    @Step("Verify auth token was cleared from localStorage")
    public HomePage shouldClearAuthToken() {
        Wait().until(driver -> {
            String key = executeJavaScript(AUTH_TOKEN_KEY_JS);
            return executeJavaScript("return localStorage.getItem(arguments[0]);", key) == null;
        });
        return this;
    }

    @Step("Verify health status contains: {textFragment}")
    public HomePage shouldShowHealthText(String textFragment) {
        healthStatus.shouldHave(text(textFragment));
        return this;
    }

    @Step("Verify items list contains: {textFragment}")
    public HomePage shouldShowItemText(String textFragment) {
        itemsList.shouldHave(text(textFragment));
        return this;
    }

    @Step("Verify items panel shows a readable error: {textFragment}")
    public HomePage shouldShowItemsError(String textFragment) {
        itemsList.shouldHave(text(textFragment));
        return this;
    }

    @Step("Verify health panel shows a readable error: {textFragment}")
    public HomePage shouldShowHealthError(String textFragment) {
        healthStatus.shouldHave(text(textFragment));
        return this;
    }

    @Step("Verify welcome message: {message}")
    public HomePage shouldHaveWelcomeMessage(String message) {
        welcomePanel.shouldBe(visible);
        welcomeMessage.shouldHave(text(message));
        return this;
    }

    /**
     * Session offers two exits: logout ends the session, delete account removes the user.
     * Click delete only against a throwaway account — never the seeded user1.
     */
    @Step("Verify session panel offers logout and delete account")
    public HomePage shouldShowSessionActions() {
        logoutButton.shouldBe(visible).shouldHave(text("Logout"));
        deleteAccountButton.shouldBe(visible).shouldHave(text("Delete account"));
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        logoutButton.click();
        return new LoginPage();
    }

    @Step("Click delete account and confirm")
    public LoginPage clickDeleteAccountAndConfirm() {
        stubConfirm(true);
        deleteAccountButton.shouldBe(visible).click();
        shouldHaveConfirmMessage();
        return new LoginPage();
    }

    @Step("Click delete account and cancel the confirm")
    public HomePage clickDeleteAccountAndCancel() {
        stubConfirm(false);
        deleteAccountButton.shouldBe(visible).click();
        shouldHaveConfirmMessage();
        return this;
    }

    @Step("Verify auth token remains in localStorage")
    public HomePage shouldKeepAuthToken() {
        Wait().until(driver -> {
            String key = executeJavaScript(AUTH_TOKEN_KEY_JS);
            return executeJavaScript("return localStorage.getItem(arguments[0]);", key) != null;
        });
        return this;
    }
}
