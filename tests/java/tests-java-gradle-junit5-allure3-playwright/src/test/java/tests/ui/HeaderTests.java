package tests.ui;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tests.TestBase;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("ui")
@Epic("Header")
@Feature("Lang and theme")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Header")
class HeaderTests extends TestBase {

    private static final Pattern THEME_LIGHT = Pattern.compile("theme-light");

    @Test
    @Tag("ui")
    @DisplayName("Login page stays English by default")
    void loginPageStaysEnglishByDefault() {
        app.login.open();
        assertThat(app.login.formTitle).containsText("Login Form");
        assertThat(app.header.langLabel).containsText("EN");
        assertThat(app.header.html).hasAttribute("lang", "en");
    }

    @Test
    @Tag("ui")
    @DisplayName("Theme toggle persists light theme after reload")
    void themeTogglePersistsLightThemeAfterReload() {
        app.login.open();
        assertThat(app.login.formTitle).containsText("Login Form");
        assertThat(app.header.html).not().hasClass(THEME_LIGHT);
        app.header.clickThemeToggle();
        assertThat(app.header.html).hasClass(THEME_LIGHT);
        app.login.reload();
        assertThat(app.header.html).hasClass(THEME_LIGHT);
    }

    @Test
    @Tag("ui")
    @DisplayName("Lang toggle switches login copy to Russian and back")
    void langToggleSwitchesLoginCopyToRussianAndBack() {
        app.login.open();
        assertThat(app.login.formTitle).containsText("Login Form");
        app.header.clickLangToggle();
        assertThat(app.header.langLabel).containsText("RU");
        assertThat(app.header.html).hasAttribute("lang", "ru");
        assertThat(app.login.formTitle).containsText("Форма входа");
        app.login.reload();
        assertThat(app.header.langLabel).containsText("RU");
        assertThat(app.header.html).hasAttribute("lang", "ru");
        assertThat(app.login.formTitle).containsText("Форма входа");
        app.header.clickLangToggle();
        assertThat(app.header.langLabel).containsText("EN");
        assertThat(app.header.html).hasAttribute("lang", "en");
        assertThat(app.login.formTitle).containsText("Login Form");
    }
}
