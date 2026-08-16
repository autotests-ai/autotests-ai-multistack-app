package pages;

import static com.codeborne.selenide.Condition.attribute;
import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.Wait;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.Selenide.open;
import static com.codeborne.selenide.Selenide.refresh;
import static pages.PageTimeouts.PAGE_READY;

import api.AuthApiClient;
import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

public class HomePage {

    /** Mirrors frontend authTokenStorageKey (backend-scoped on matrix paths). */
    private static final String AUTH_TOKEN_KEY_JS =
            "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
                    + "return m ? 'authToken:' + m[1] : 'authToken';";

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

    @Step("Open home page")
    public HomePage openPage() {
        open("/");
        return this;
    }

    @Step("Reload current page")
    public HomePage reloadPage() {
        refresh();
        return this;
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
        return this;
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
        return this;
    }

    @Step("Verify home layout is mounted")
    public HomePage shouldShowLayout() {
        layout.shouldBe(visible, PAGE_READY);
        itemsList.shouldBe(visible);
        return this;
    }

    @Step("Verify embedded header is mounted")
    public HomePage shouldShowEmbeddedHeader() {
        header.shouldBe(visible, PAGE_READY);
        return this;
    }

    @Step("Verify welcome panel stays hidden")
    public HomePage shouldHideWelcomePanel() {
        // Panel uses the HTML hidden attribute (welcome === null); remote Chrome may still report isDisplayed().
        welcomePanel.shouldHave(attribute("hidden"), PAGE_READY);
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
        healthStatus.shouldHave(text(textFragment), PAGE_READY);
        return this;
    }

    @Step("Verify items list contains: {textFragment}")
    public HomePage shouldShowItemText(String textFragment) {
        itemsList.shouldHave(text(textFragment), PAGE_READY);
        return this;
    }

    @Step("Verify items panel shows a readable error: {textFragment}")
    public HomePage shouldShowItemsError(String textFragment) {
        itemsList.shouldHave(text(textFragment), PAGE_READY);
        return this;
    }

    @Step("Verify health panel shows a readable error: {textFragment}")
    public HomePage shouldShowHealthError(String textFragment) {
        healthStatus.shouldHave(text(textFragment), PAGE_READY);
        return this;
    }

    @Step("Verify welcome message: {message}")
    public HomePage shouldHaveWelcomeMessage(String message) {
        welcomePanel.shouldBe(visible, PAGE_READY);
        welcomeMessage.shouldHave(text(message));
        return this;
    }

    /**
     * Session offers two exits: logout ends the session, delete account removes the user.
     * Only presence is asserted here — actually clicking delete would drop the seeded
     * account the whole prod suite logs in with. The behaviour lives in the frontend
     * component suites, and the endpoint itself in AuthApiTests / AuthRoundTripApiTests.
     */
    @Step("Verify session panel offers logout and delete account")
    public HomePage shouldShowSessionActions() {
        logoutButton.shouldBe(visible, PAGE_READY).shouldHave(text("Logout"));
        deleteAccountButton.shouldBe(visible).shouldHave(text("Delete account"));
        return this;
    }

    @Step("Click logout button")
    public LoginPage clickLogoutButton() {
        logoutButton.click();
        return new LoginPage();
    }
}
