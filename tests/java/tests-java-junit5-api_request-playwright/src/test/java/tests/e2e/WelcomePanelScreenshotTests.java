package tests.e2e;

import annotations.Layer;
import annotations.SubSuite;
import annotations.Suite;
import helpers.ScreenshotHelper;
import helpers.ViewportHelper;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.ResourceAccessMode;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tests.TestBase;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Layer("e2e")
@Severity(SeverityLevel.MINOR)
@Tag("e2e")
@Tag("screenshot")
@Epic("Authentication")
@Feature("Welcome panel")
@Suite("Welcome panel")
@SubSuite("screenshot")
@ResourceLock(value = "screenshot-compare", mode = ResourceAccessMode.READ_WRITE)
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Welcome panel screenshot")
class WelcomePanelScreenshotTests extends TestBase {

    private static final int VIEWPORT_HEIGHT = 900;

    @ParameterizedTest(name = "Welcome panel matches screenshot at {0}px")
    @ValueSource(ints = {390, 768, 1280})
    @DisplayName("Welcome panel matches screenshot")
    void welcomePanelMatchesScreenshot(int viewportWidth) {
        ViewportHelper.setViewport(viewportWidth, VIEWPORT_HEIGHT);
        app.login.open().login("user1", "password1");
        assertThat(app.home.welcomeMessage)
                .containsText("Welcome, " + config.welcomeUsername() + "!");

        ScreenshotHelper.captureAndCompare(
                app.home.welcomePanel,
                "welcome-panel",
                viewportWidth,
                "welcome-panel-" + viewportWidth);
    }
}
