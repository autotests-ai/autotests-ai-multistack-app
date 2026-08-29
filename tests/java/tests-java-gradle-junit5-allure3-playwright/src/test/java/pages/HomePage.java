package pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import io.qameta.allure.Step;

public class HomePage {

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
        page.navigate("/");
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
        page.onceDialog(dialog -> dialog.accept());
        deleteAccountButton.click();
        return this;
    }

    @Step("Cancel delete-account confirm")
    public HomePage clickDeleteAccountAndCancel() {
        page.onceDialog(dialog -> dialog.dismiss());
        deleteAccountButton.click();
        return this;
    }

    @Step("Seed localStorage auth token")
    public HomePage openWithLocalStorageAuth(String token) {
        page.navigate("login");
        var key = authTokenKey();
        page.evaluate(
                "arg => localStorage.setItem(arg.key, arg.token)",
                java.util.Map.of("key", key, "token", token));
        return open();
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
