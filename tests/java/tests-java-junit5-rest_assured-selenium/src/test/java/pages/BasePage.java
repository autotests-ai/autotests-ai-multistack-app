package pages;

import api.AuthApiClient;
import helpers.Ui;
import io.qameta.allure.Step;
import pages.components.HeaderComponent;

public abstract class BasePage<T extends BasePage<T>> {

    private static final String AUTH_TOKEN_KEY_JS =
            "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
                    + "return m ? 'authToken:' + m[1] : 'authToken';";

    public final HeaderComponent header = new HeaderComponent();

    public abstract T shouldBeOpen();

    @Step("Reload current page")
    public T reloadPage() {
        Ui.refresh();
        return shouldBeOpen();
    }

    protected void openPageWithLocalStorageAuthentication(String pagePath, String username, String password) {
        openPageWithLocalStorageToken(pagePath, AuthApiClient.login(username, password));
    }

    protected void openPageWithLocalStorageToken(String pagePath, String token) {
        Ui.open("/icons/qa-guru-logo.svg");
        Ui.js(
                "localStorage.setItem(arguments[0], arguments[1]);",
                authTokenKey(),
                token
        );
        Ui.open(pagePath);
    }

    protected void waitForAuthTokenToBeCleared() {
        Ui.waitUntil(driver -> authToken() == null);
    }

    protected void waitForAuthTokenToBePresent() {
        Ui.waitUntil(driver -> authToken() != null);
    }

    private String authTokenKey() {
        return String.valueOf(Ui.js(AUTH_TOKEN_KEY_JS));
    }

    private Object authToken() {
        return Ui.js("return localStorage.getItem(arguments[0]);", authTokenKey());
    }
}
