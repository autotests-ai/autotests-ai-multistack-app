package tests.e2e

import annotations.Layer
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import io.qameta.allure.Epic
import io.qameta.allure.Feature
import io.qameta.allure.Severity
import io.qameta.allure.SeverityLevel
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import tests.TestBase

@Layer("e2e")
@Epic("Home")
@Feature("Health and items")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Home")
class HomeTests : TestBase() {

    @Test
    @Tag("e2e")
    @Tag("smoke")
    @DisplayName("Home loads health and seed items")
    fun homeLoadsHealthAndItems() {
        app.home.open()
        assertThat(app.home.healthStatus).containsText("service: " + config.apiHealthService())
        assertThat(app.home.itemsList).containsText("Alpha")
    }
}
