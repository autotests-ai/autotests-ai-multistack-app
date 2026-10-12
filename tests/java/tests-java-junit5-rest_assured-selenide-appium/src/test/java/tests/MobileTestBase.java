package tests;

import allure.Attach;
import annotations.Framework;
import annotations.Scope;
import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.appium.SelenideAppium;
import com.codeborne.selenide.logevents.SelenideLogger;
import drivers.mobile.BrowserstackMobileDriver;
import drivers.mobile.LocalMobileDriver;
import drivers.mobile.SelenoidMobileDriver;
import io.qameta.allure.selenide.AllureSelenide;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import screens.LoginScreen;

@Scope("mobile")
@Framework("selenide")
public class MobileTestBase {

    protected final LoginScreen loginScreen = new LoginScreen();
    private final Attach attach = new Attach();

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

        // deviceHost picks the provider; platform is an axis inside it.
        Configuration.browser = switch (System.getProperty("deviceHost")) {
            case "emulator", "real", "simulator" -> LocalMobileDriver.class.getName();
            case "selenoid" -> SelenoidMobileDriver.class.getName();
            case "browserstack" -> BrowserstackMobileDriver.class.getName();
            default -> throw new IllegalArgumentException(
                    "deviceHost: emulator, real, simulator (local Appium), selenoid, browserstack. Got: "
                            + System.getProperty("deviceHost"));
        };
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
        SelenideAppium.launchApp();
        attach.beforeTest();
    }

    @AfterEach
    void afterEach() {
        attach.afterTest();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
