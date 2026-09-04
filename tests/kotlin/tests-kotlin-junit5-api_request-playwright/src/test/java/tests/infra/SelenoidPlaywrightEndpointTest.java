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
    @DisplayName("session query is appended without dropping existing params")
    void appendsSessionQuery() {
        var ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var out = SelenoidPlaywrightEndpoint.withSessionQuery(ws, false, false);
        assertTrue(out.startsWith(ws + "&"));
        assertTrue(out.contains("name=autotests-ai-multistack-kotlin-pw"));
        assertTrue(out.contains("sessionTimeout=5m"));
        assertTrue(out.contains("enableVNC=false"));
        assertTrue(out.contains("enableVideo=false"));
    }

    @Test
    @DisplayName("videoName and screenResolution go on the WS query when hub records")
    void recordsVideoNameOnConnect() {
        var ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var out = SelenoidPlaywrightEndpoint.withSessionQuery(
                ws, true, true, "kotlin-pw-clip.mp4", "1920x1280x24");
        assertTrue(out.startsWith(ws + "&"));
        assertTrue(out.contains("enableVideo=true"));
        assertTrue(out.contains("enableVNC=true"));
        assertTrue(out.contains("videoName=kotlin-pw-clip.mp4"));
        assertTrue(out.contains("screenResolution=1920x1280x24"));
        assertTrue(out.contains("accessKey=x"));
    }

    @Test
    @DisplayName("hub video URL is videoFolder + videoName")
    void videoUrlJoinsFolderAndName() {
        assertEquals(
                "https://selenoid.qa.guru/video/kotlin-pw-clip.mp4",
                SelenoidPlaywrightEndpoint.videoUrl(
                        "https://selenoid.qa.guru/video/", "kotlin-pw-clip.mp4"));
        assertEquals(
                "https://selenoid.qa.guru/video/kotlin-pw-clip.mp4",
                SelenoidPlaywrightEndpoint.videoUrl(
                        "https://selenoid.qa.guru/video", "kotlin-pw-clip.mp4"));
        assertEquals("", SelenoidPlaywrightEndpoint.videoUrl("", "clip.mp4"));
        assertEquals("", SelenoidPlaywrightEndpoint.videoUrl("https://selenoid.qa.guru/video/", ""));
    }
}
