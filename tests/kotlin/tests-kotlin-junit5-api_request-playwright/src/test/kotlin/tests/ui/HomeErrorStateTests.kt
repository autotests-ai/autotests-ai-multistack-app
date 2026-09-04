package tests.ui

import annotations.Layer
import api.MockScenarios
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assumptions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.parallel.Execution
import org.junit.jupiter.api.parallel.ExecutionMode
import org.junit.jupiter.api.parallel.Isolated
import tests.TestBase

@Layer("ui")
@Epic("Home")
@Feature("Error states")
@Severity(SeverityLevel.NORMAL)
@DisplayName("Home error states (mock)")
@Isolated("WireMock scenarios are process-global")
@Execution(ExecutionMode.SAME_THREAD)
class HomeErrorStateTests : TestBase() {

    private var mockStandAvailable = false

    @BeforeEach
    fun requireMockStand() {
        mockStandAvailable = MockScenarios.available()
        Assumptions.assumeTrue(
            mockStandAvailable,
            "WireMock admin API is not exposed on this stand — error injection needs the mock profile",
        )
    }

    @AfterEach
    fun resetScenarios() {
        if (mockStandAvailable) {
            MockScenarios.resetAll()
        }
    }

    @Test
    @Tag("ui")
    @Tag("mock")
    @Tag("negative")
    @DisplayName("Items API failure shows a readable error, not a blank page")
    fun itemsApiFailureShowsReadableError() {
        MockScenarios.setState("items", "error")
        app.home.open()
        assertThat(app.home.itemsList).containsText("✗ items: HTTP 500")
    }

    @Test
    @Tag("ui")
    @Tag("mock")
    @Tag("negative")
    @DisplayName("Health API failure shows a readable error in the health panel")
    fun healthApiFailureShowsReadableError() {
        MockScenarios.setState("health", "error")
        app.home.open()
        assertThat(app.home.healthStatus).containsText("✗ health: HTTP 500")
    }
}
