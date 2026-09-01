package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import io.qameta.allure.Step;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static api.AuthApiClient.login;

public class HomePage {

    /** Mirrors frontend DELETE_ACCOUNT_CONFIRM. */
    private static final String DELETE_ACCOUNT_CONFIRM =
            "Delete this account? This cannot be undone.";

    private final Page page;
    public final Locator layout;
    public final Locator healthStatus;
    public final Locator itemsList;
    public final Locator welcomeMessage;
    public final Locator welcomePanel;
    public final Locator logoutButton;
    public final Locator deleteAccountButton;
    public final Locator header;

    public HomePage(Page page) {
        this.page = page;
        this.layout = page.getByTestId("multistack-layout");
        this.healthStatus = page.getByTestId("health-status");
        this.itemsList = page.getByTestId("items-list");
        this.welcomeMessage = page.getByTestId("welcome-message");
        this.welcomePanel = page.getByTestId("welcome-panel");
        this.logoutButton = page.getByTestId("logout-button");
        this.deleteAccountButton = page.getByTestId("delete-account-button");
        this.header = page.getByTestId("header");
    }

    @Step("Open home page")
    public HomePage open() {
        // Relative to context baseURL (path prefix on prod/stage). navigate("/") is
        // origin-absolute and drops /stack/.../frontend-.../.
        page.navigate("./");
        return shouldBeOpen();
    }

    @Step("Verify home layout is open")
    public HomePage shouldBeOpen() {
        layout.waitFor();
        return this;
    }

    @Step("Verify reference layout is mounted")
    public HomePage shouldShowLayout() {
        layout.waitFor();
        itemsList.waitFor();
        return this;
    }

    @Step("Verify home layout and health are mounted")
    public HomePage shouldShowLayoutAndHealth() {
        layout.waitFor();
        healthStatus.waitFor();
        return this;
    }

    @Step("Verify health and items finished loading")
    public HomePage shouldShowSettledHealthAndItems() {
        shouldShowLayoutAndHealth();
        itemsList.waitFor();
        assertThat(healthStatus).not().containsText("Checking health");
        assertThat(itemsList).not().containsText("Loading items");
        return this;
    }

    @Step("Logout")
    public HomePage logout() {
        logoutButton.click();
        return this;
    }

    @Step("Reload home")
    public HomePage reload() {
        page.reload();
        return shouldBeOpen();
    }

    @Step("Accept delete-account confirm")
    public HomePage clickDeleteAccountAndConfirm() {
        page.onceDialog(dialog -> {
            requireConfirmText(dialog.message());
            dialog.accept();
        });
        deleteAccountButton.click();
        return this;
    }

    @Step("Cancel delete-account confirm")
    public HomePage clickDeleteAccountAndCancel() {
        page.onceDialog(dialog -> {
            requireConfirmText(dialog.message());
            dialog.dismiss();
        });
        deleteAccountButton.click();
        return this;
    }

    private static void requireConfirmText(String actual) {
        if (!DELETE_ACCOUNT_CONFIRM.equals(actual)) {
            throw new AssertionError(
                    "Confirm text: expected <%s> but was <%s>"
                            .formatted(DELETE_ACCOUNT_CONFIRM, actual));
        }
    }

    @Step("Open home page with local storage authentication")
    public HomePage openWithLocalStorageAuthentication(String username, String password) {
        return openWithLocalStorageAuth(login(username, password));
    }

    @Step("Seed localStorage auth token")
    public HomePage openWithLocalStorageAuth(String token) {
        page.navigate("login");
        page.getByTestId("login-form").waitFor();
        var key = authTokenKey();
        page.evaluate(
                "arg => localStorage.setItem(arg.key, arg.token)",
                java.util.Map.of("key", key, "token", token));
        return open();
    }

    @Step("Verify welcome panel stays hidden")
    public HomePage shouldHideWelcomePanel() {
        assertThat(welcomePanel).hasAttribute("hidden", "");
        return this;
    }

    @Step("Verify auth token was cleared from localStorage")
    public HomePage shouldClearAuthToken() {
        page.waitForFunction("""
                () => {
                  const m = location.pathname.match(/\\/(backend-[^/]+)\\//);
                  const key = m ? `authToken:${m[1]}` : 'authToken';
                  return localStorage.getItem(key) === null;
                }
                """);
        return this;
    }

    @Step("Verify session panel offers logout and delete account")
    public HomePage shouldShowSessionActions() {
        assertThat(logoutButton).isVisible();
        assertThat(logoutButton).containsText("Logout");
        assertThat(deleteAccountButton).isVisible();
        assertThat(deleteAccountButton).containsText("Delete account");
        return this;
    }

    @Step("Open home with a garbage auth token")
    public HomePage openWithInvalidToken() {
        return openWithLocalStorageAuth("invalid-token");
    }

    public String authTokenKey() {
        var key = (String) page.evaluate("""
                () => {
                  const m = location.pathname.match(/\\/(backend-[^/]+)\\//);
                  return m ? `authToken:${m[1]}` : 'authToken';
                }
                """);
        return key;
    }

    public String authToken() {
        return (String) page.evaluate("k => localStorage.getItem(k)", authTokenKey());
    }
}
