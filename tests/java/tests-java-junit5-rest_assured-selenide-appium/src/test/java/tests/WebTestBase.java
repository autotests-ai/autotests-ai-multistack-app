package tests;

import allure.Attach;
import annotations.Framework;
import annotations.Scope;
import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.logevents.SelenideLogger;
import config.ConfigReader;
import config.TestConfig;
import drivers.web.WebBrowserDriver;
import io.qameta.allure.selenide.AllureSelenide;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import pages.HomePage;
import pages.LoginPage;
import pages.RegisterPage;

import static com.codeborne.selenide.Selenide.open;

@Scope("browser")
@Framework("selenide")
public class WebTestBase {

    protected final HomePage homePage = new HomePage();
    protected final LoginPage loginPage = new LoginPage();
    protected final RegisterPage registerPage = new RegisterPage();
    private final Attach attach = new Attach();

    @BeforeAll
    static void beforeAll() {
        if (blank(System.getProperty("env"))) {
            System.setProperty("env", "prod");
        }
        TestConfig config = ConfigReader.testConfig;
        String baseUrl = config.baseUrl();
        if (blank(baseUrl)) {
            throw new IllegalStateException("Set baseUrl in config/${env}.properties");
        }
        Configuration.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        Configuration.browser = WebBrowserDriver.class.getName();
        Configuration.browserSize = config.browserSize();
        Configuration.timeout = 10_000;
        Configuration.screenshots = true;
        Configuration.savePageSource = false;
    }

    @BeforeEach
    void beforeEach() {
        SelenideLogger.addListener("AllureSelenide", new AllureSelenide()
                .screenshots(true)
                .savePageSource(false));
        open();
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
