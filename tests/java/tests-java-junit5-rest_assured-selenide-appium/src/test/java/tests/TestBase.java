package tests;

import annotations.Framework;
import annotations.Scope;
import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.logevents.SelenideLogger;
import config.NativeEnv;
import drivers.MobileDriver;
import io.qameta.allure.selenide.AllureSelenide;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import pages.LoginScreen;

import static com.codeborne.selenide.Selenide.closeWebDriver;
import static com.codeborne.selenide.Selenide.open;

@Scope("mobile")
@Framework("selenide")
public class TestBase {

    protected final LoginScreen loginScreen = new LoginScreen();

    @BeforeAll
    static void beforeAll() {
        NativeEnv.requireCompatibleHost();
        Configuration.browser = MobileDriver.class.getName();
        Configuration.browserSize = null;
        Configuration.timeout = 30_000;
        Configuration.pageLoadTimeout = 1;
        Configuration.screenshots = true;
        Configuration.savePageSource = false;
    }

    @BeforeEach
    void beforeEach() {
        SelenideLogger.addListener("AllureSelenide", new AllureSelenide()
                .screenshots(true)
                .savePageSource(false));
        open();
    }

    @AfterEach
    void afterEach() {
        closeWebDriver();
    }
}
