package tests.e2e;

import tests.TestBase;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;

@Layer("e2e")
@Severity(SeverityLevel.MINOR)
@Tag("screenshot")
@Epic("Authentication")
@Feature("Welcome panel")
@Suite("Welcome panel")
@SubSuite("screenshot")
@Execution(ExecutionMode.SAME_THREAD)
@DisplayName("Welcome panel screenshot")
class WelcomePanelScreenshotTests extends TestBase {

    private static final int VIEWPORT_HEIGHT = 900;

    @ParameterizedTest(name = "Welcome panel matches screenshot at {0}px")
    @ValueSource(ints = {390, 768, 1280})
    @DisplayName("Welcome panel matches screenshot")
    void welcomePanelMatchesScreenshot(int viewportWidth) {
        ViewportHelper.setViewport(viewportWidth, VIEWPORT_HEIGHT);
        var expectedUser = "reference_mock".equals(System.getProperty("env", "").trim())
                ? "mock-user"
                : "user1";
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, " + expectedUser + "!");

        var welcomePanel = $("[data-testid='welcome-panel']").shouldBe(visible);
        ScreenshotHelper.captureAndCompare(
                welcomePanel,
                "welcome-panel",
                viewportWidth,
                "welcome-panel-" + viewportWidth);
    }
}
