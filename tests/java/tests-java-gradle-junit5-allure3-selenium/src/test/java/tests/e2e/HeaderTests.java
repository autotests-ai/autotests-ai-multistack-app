package tests.e2e;

import tests.TestBase;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Header")
@Feature("Lang and theme")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Header")
class HeaderTests extends TestBase {

    @Test
    @Tag("e2e")
    @DisplayName("Login page stays English by default")
    void loginPageStaysEnglishByDefault() {
        loginPage.openPage()
                .shouldHaveFormTitle("Login Form")
                .header.shouldHaveLangLabel("EN")
                .shouldHaveHtmlLang("en");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Theme toggle persists light theme after reload")
    void themeTogglePersistsLightThemeAfterReload() {
        loginPage.openPage()
                .shouldHaveFormTitle("Login Form")
                .header.shouldHaveTheme("dark")
                .clickThemeToggle()
                .shouldHaveTheme("light");
        loginPage.reloadPage()
                .header.shouldHaveTheme("light");
    }

    @Test
    @Tag("e2e")
    @DisplayName("Lang toggle switches login copy to Russian and back")
    void langToggleSwitchesLoginCopyToRussianAndBack() {
        loginPage.openPage()
                .shouldHaveFormTitle("Login Form")
                .header.clickLangToggle()
                .shouldHaveLangLabel("RU")
                .shouldHaveHtmlLang("ru");
        loginPage.shouldHaveFormTitle("Форма входа")
                .reloadPage()
                .header.shouldHaveLangLabel("RU")
                .shouldHaveHtmlLang("ru");
        loginPage.shouldHaveFormTitle("Форма входа")
                .header.clickLangToggle()
                .shouldHaveLangLabel("EN")
                .shouldHaveHtmlLang("en");
        loginPage.shouldHaveFormTitle("Login Form");
    }
}
