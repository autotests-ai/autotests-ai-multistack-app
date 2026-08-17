package helpers;

import com.codeborne.selenide.SelenideElement;

import static com.codeborne.selenide.Selenide.executeJavaScript;

/**
 * React 19 controlled {@code <input>} ignores a DOM {@code .value} write without
 * native setter + {@code input}/{@code change} events. Selenide {@code setValue}
 * is enough on a cold document and not enough after hot-pool park + remount.
 */
public final class ReactInput {

    private ReactInput() {
    }

    public static void setValue(SelenideElement input, String text) {
        String testId = input.getAttribute("data-testid");
        if (testId == null || testId.isBlank()) {
            throw new IllegalArgumentException("ReactInput.setValue needs data-testid");
        }
        executeJavaScript(
                "const el = document.querySelector('[data-testid=\"' + arguments[0] + '\"]');"
                        + "if (!el) { throw new Error('missing [data-testid=' + arguments[0] + ']'); }"
                        + "const v = arguments[1];"
                        + "const desc = Object.getOwnPropertyDescriptor("
                        + "window.HTMLInputElement.prototype, 'value');"
                        + "desc.set.call(el, v);"
                        + "el.dispatchEvent(new Event('input', {bubbles: true}));"
                        + "el.dispatchEvent(new Event('change', {bubbles: true}));",
                testId,
                text);
    }

    public static void fillAndSubmitLogin(String username, String password) {
        executeJavaScript(
                "const nativeSet = (el, v) => {"
                        + "  const desc = Object.getOwnPropertyDescriptor("
                        + "      window.HTMLInputElement.prototype, 'value');"
                        + "  desc.set.call(el, v);"
                        + "  el.dispatchEvent(new Event('input', {bubbles: true}));"
                        + "  el.dispatchEvent(new Event('change', {bubbles: true}));"
                        + "};"
                        + "const login = document.querySelector('[data-testid=\"login-input\"]');"
                        + "const pass = document.querySelector('[data-testid=\"password-input\"]');"
                        + "const form = document.querySelector('[data-testid=\"login-form\"]');"
                        + "if (!login || !pass || !form) { throw new Error('login form not mounted'); }"
                        + "nativeSet(login, arguments[0]);"
                        + "nativeSet(pass, arguments[1]);"
                        + "form.requestSubmit();",
                username,
                password);
    }
}
