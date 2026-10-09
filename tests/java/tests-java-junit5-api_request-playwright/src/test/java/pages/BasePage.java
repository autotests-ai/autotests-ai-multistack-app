package pages;

import com.microsoft.playwright.Page;

import static api.AuthApiClient.login;

public abstract class BasePage<T extends BasePage<T>> {

    private static final String AUTH_TOKEN_KEY_JS = """
            () => {
              const m = location.pathname.match(/\\/(backend-[^/]+)\\//);
              return m ? `authToken:${m[1]}` : 'authToken';
            }
            """;

    protected final Page page;

    protected BasePage(Page page) {
        this.page = page;
    }

    public abstract T shouldBeOpen();

    protected String authenticate(String username, String password) {
        return login(username, password);
    }

    protected void openPageWithLocalStorageToken(String pagePath, String token) {
        page.navigate("icons/qa-guru-logo.svg");
        page.evaluate(
                "arg => localStorage.setItem(arg.key, arg.token)",
                java.util.Map.of("key", authTokenKey(), "token", token));
        page.navigate(pagePath);
    }

    protected void waitForAuthTokenToBeCleared() {
        page.waitForFunction("() => localStorage.getItem((" + AUTH_TOKEN_KEY_JS + ")()) === null");
    }

    public String authTokenKey() {
        return (String) page.evaluate(AUTH_TOKEN_KEY_JS);
    }

    public String authToken() {
        return (String) page.evaluate("k => localStorage.getItem(k)", authTokenKey());
    }
}
