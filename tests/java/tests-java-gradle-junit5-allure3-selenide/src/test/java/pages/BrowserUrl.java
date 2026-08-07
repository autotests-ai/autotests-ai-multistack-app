package pages;

import config.ConfigReader;

import static com.codeborne.selenide.Selenide.Wait;

/**
 * URL assertions shared by page objects. The SPA root lands as {@code https://host/mount}
 * on prod path-mounts but {@code http://host:port/} on root-origin stands (ci/mock gateway)
 * — browsers keep the trailing slash at an origin root, so compare slash-insensitively.
 */
final class BrowserUrl {

    private BrowserUrl() {
    }

    static void shouldBeAtAppRoot() {
        String expected = ConfigReader.resolveWebBaseUrl();
        Wait().until(driver -> {
            String current = driver.getCurrentUrl().replaceAll("/+$", "");
            return current.equals(expected);
        });
    }
}
