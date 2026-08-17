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
        executeJavaScript(
                "const el = arguments[0];"
                        + "const v = arguments[1];"
                        + "const desc = Object.getOwnPropertyDescriptor("
                        + "window.HTMLInputElement.prototype, 'value');"
                        + "desc.set.call(el, v);"
                        + "el.dispatchEvent(new Event('input', {bubbles: true}));"
                        + "el.dispatchEvent(new Event('change', {bubbles: true}));",
                input.getWrappedElement(),
                text);
    }
}
