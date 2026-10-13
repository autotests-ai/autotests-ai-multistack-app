package tests;

import allure.Attach;
import annotations.Framework;
import annotations.Scope;
import drivers.mobile.MobileDriver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import screens.LoginScreen;

@Scope("mobile")
@Framework("selenium")
@ExtendWith(Attach.ScreenshotOnFailure.class)
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
    }

    @BeforeEach
    void beforeEach() {
        attach.beforeTest(MobileDriver.start());
    }

    @AfterEach
    void afterEach() {
        attach.afterTest();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
