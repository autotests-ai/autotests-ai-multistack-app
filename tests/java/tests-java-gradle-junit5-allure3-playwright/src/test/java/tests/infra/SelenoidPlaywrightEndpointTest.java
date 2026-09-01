package tests.infra;

import annotations.Layer;
import helpers.SelenoidPlaywrightEndpoint;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import tests.AllureMeta;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("infra")
@Epic("Test infra")
@Feature("Selenoid Playwright endpoint")
@Severity(SeverityLevel.NORMAL)
@Tag("infra")
@Tag("infra-frontend")
@DisplayName("Selenoid Playwright endpoint")
@Execution(ExecutionMode.SAME_THREAD)
class SelenoidPlaywrightEndpointTest extends AllureMeta {

    @Test
    @DisplayName("wss is a Playwright hub, https /wd/hub is not")
    void classifiesSchemes() {
        assertTrue(SelenoidPlaywrightEndpoint.isWebSocket(
                "wss://selenoid.example/playwright/playwright-chromium/1.61.1"));
        assertTrue(SelenoidPlaywrightEndpoint.isHttpUrl("https://selenoid.example/wd/hub"));
        assertFalse(SelenoidPlaywrightEndpoint.isWebSocket(""));
        assertFalse(SelenoidPlaywrightEndpoint.isHttpUrl(""));
    }

    @Test
    @DisplayName("describe strips query so accessKey never appears in logs")
    void describeDropsQuery() {
        var raw = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=secret";
        assertEquals(
                "wss://selenoid.example/playwright/playwright-chromium/1.61.1",
                SelenoidPlaywrightEndpoint.describe(raw));
        assertFalse(SelenoidPlaywrightEndpoint.describe(raw).contains("secret"));
    }

    @Test
    @DisplayName("env WebSocket wins over truncated -DremoteUrl")
    void envWebSocketWinsOverConfig() {
        var env = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var truncated = "wss://selenoid.example/playwright/playwright-chromium/1.61.1";
        assertEquals(env, SelenoidPlaywrightEndpoint.preferWebSocket(env, truncated));
        assertEquals(truncated, SelenoidPlaywrightEndpoint.preferWebSocket("", truncated));
        assertEquals("", SelenoidPlaywrightEndpoint.preferWebSocket("", ""));
    }

    @Test
    @DisplayName("forConnect percent-encodes braces in the query only")
    void forConnectEncodesQueryBraces() {
        var ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x}";
        assertEquals(
                "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x%7D",
                SelenoidPlaywrightEndpoint.forConnect(ws));
        assertEquals(
                "wss://selenoid.example/playwright/playwright-chromium/1.61.1",
                SelenoidPlaywrightEndpoint.forConnect(
                        "wss://selenoid.example/playwright/playwright-chromium/1.61.1"));
    }
}
