package helpers;

import com.codeborne.selenide.FluentCommand;
import com.codeborne.selenide.SetValueOptions;
import com.codeborne.selenide.commands.Commands;
import com.codeborne.selenide.ex.InvalidStateError;
import com.codeborne.selenide.impl.WebElementSource;
import org.openqa.selenium.WebElement;

import static com.codeborne.selenide.Selenide.executeJavaScript;
import static com.codeborne.selenide.SetValueOptions.withText;
import static java.util.Objects.requireNonNull;
import static java.util.Objects.requireNonNullElse;
import static org.apache.commons.lang3.StringUtils.isNotEmpty;

/**
 * Replaces Selenide {@code setValue} when {@code -DfastSetValue=true}.
 * Stock Selenide JS assigns {@code el.value}; React 19 ignores that after remount.
 * This uses the native prototype setter (same idea as Playwright {@code fill}).
 */
public final class NativeSetValue extends FluentCommand {

    private static final String SET_NATIVE =
            "const passed = arguments[0];"
                    + "const text = arguments[1];"
                    + "const testid = passed.getAttribute('data-testid');"
                    + "const el = (testid && document.querySelector('[data-testid=\"' + testid + '\"]')) || passed;"
                    + "if (el.getAttribute('readonly') !== null) return 'Cannot change value of readonly element';"
                    + "if (el.getAttribute('disabled') !== null) return 'Cannot change value of disabled element';"
                    + "const maxlength = el.getAttribute('maxlength') == null ? -1 : parseInt(el.getAttribute('maxlength'));"
                    + "const v = maxlength === -1 ? text : text.length <= maxlength ? text : text.substring(0, maxlength);"
                    + "const proto = el.tagName === 'TEXTAREA'"
                    + "  ? window.HTMLTextAreaElement.prototype"
                    + "  : window.HTMLInputElement.prototype;"
                    + "const desc = Object.getOwnPropertyDescriptor(proto, 'value');"
                    + "if (desc && desc.set) { desc.set.call(el, v); } else { el.value = v; }"
                    + "el.dispatchEvent(new Event('input', { bubbles: true }));"
                    + "el.dispatchEvent(new Event('change', { bubbles: true }));"
                    + "return null;";

    private NativeSetValue() {
    }

    public static void install() {
        Commands.getInstance().add("setValue", new NativeSetValue());
    }

    @Override
    protected void execute(WebElementSource locator, Object[] args) {
        SetValueOptions options = extractOptions(requireNonNull(args));
        WebElement element = locator.findAndAssertElementIsEditable();
        CharSequence value = requireNonNullElse(options.value(), "");
        Object error = executeJavaScript(SET_NATIVE, element, value.toString());
        if (error instanceof String message && isNotEmpty(message)) {
            throw new InvalidStateError(locator.description(), message);
        }
    }

    private static SetValueOptions extractOptions(Object[] args) {
        if (args[0] instanceof SetValueOptions options) {
            return options;
        }
        return withText((CharSequence) args[0]);
    }
}
