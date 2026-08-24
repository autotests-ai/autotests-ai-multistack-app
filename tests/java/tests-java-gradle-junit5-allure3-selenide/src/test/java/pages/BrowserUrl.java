package pages;

import com.codeborne.selenide.Configuration;

import static com.codeborne.selenide.Selenide.Wait;
import static com.codeborne.selenide.Selenide.executeJavaScript;
import static pages.PageTimeouts.PAGE_READY;

/**
 * URL assertions shared by page objects. The SPA root lands as {@code https://host/mount}
 * on prod path-mounts but {@code http://host:port/} on root-origin stands (ci/mock gateway)
 * — browsers keep the trailing slash at an origin root, so compare slash-insensitively.
 */
final class BrowserUrl {

    private BrowserUrl() {
    }

    static void shouldBeAtAppRoot() {
        String expected = Configuration.baseUrl.replaceAll("/+$", "");
        Wait().withTimeout(PAGE_READY).until(driver -> {
            String current = driver.getCurrentUrl().replaceAll("/+$", "");
            if (current.equals(expected)) {
                return true;
            }
            Object err = executeJavaScript(
                    "const n = document.querySelector('[data-testid=\"error-message\"], [data-testid=\"register-error-message\"]');"
                            + "return n ? n.textContent : '';");
            String message = err == null ? "" : err.toString().trim();
            if (!message.isEmpty()) {
                throw new AssertionError("login stayed at " + current + "; error=" + message);
            }
            return false;
        });
    }
}
