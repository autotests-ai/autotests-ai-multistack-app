package tests;

import annotations.Framework;
import annotations.Scope;
import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.logevents.SelenideLogger;
import drivers.AndroidDriverProvider;
import drivers.IosDriverProvider;
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
        if (blank(System.getProperty("env"))) {
            System.setProperty("env", "prod");
        }
        if (blank(System.getProperty("deviceHost"))) {
            System.setProperty("deviceHost", "emulator");
        }
        if (blank(System.getProperty("platform"))) {
            System.setProperty("platform", "android");
        }

        String platform = System.getProperty("platform");
        if ("ios".equalsIgnoreCase(platform)) {
            Configuration.browser = IosDriverProvider.class.getName();
        } else if ("android".equalsIgnoreCase(platform)) {
            Configuration.browser = AndroidDriverProvider.class.getName();
        } else {
            throw new IllegalArgumentException("platform: android or ios. Got: " + platform);
        }
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

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
