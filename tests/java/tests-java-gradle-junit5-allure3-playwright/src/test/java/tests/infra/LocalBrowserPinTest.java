package tests.infra;

import tests.AllureMeta;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import config.ConfigReader;
import config.TestConfig;
import helpers.LocalChromePin;
import helpers.PlaywrightRuntime;
import org.aeonbits.owner.ConfigFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Local browser pin (infra-frontend): this cell is Chromium-only.
 * <p>
 * Living helper is {@link LocalChromePin} (Chrome for Testing).
 * {@link PlaywrightRuntime} applies it on every local launch. Remote runs use
 * Selenoid {@code playwright-chromium} WS.
 */
@Layer("infra")
@Epic("Test infra")
@Feature("Local browser pin")
@Severity(SeverityLevel.NORMAL)
@Tag("infra")
@Tag("infra-frontend")
@DisplayName("Local browser pin")
@Execution(ExecutionMode.SAME_THREAD)
class LocalBrowserPinTest extends AllureMeta {

    private static String major(String version) {
        return version.split("\\.")[0];
    }

    @Test
    @DisplayName("pinnedVersion is a full Chrome for Testing build number")
    void pinnedVersionIsFullBuildNumber() {
        assertTrue(LocalChromePin.pinnedVersion().matches("\\d+\\.\\d+\\.\\d+\\.\\d+"),
                "chrome-for-testing.properties must pin an exact build, got: " + LocalChromePin.pinnedVersion());
    }

    @Test
    @DisplayName("configured browserVersion stays on the pinned major")
    void configuredBrowserVersionMatchesPin() {
        assertEquals(major(LocalChromePin.pinnedVersion()),
                major(ConfigReader.testConfig.browserVersion()),
                "browserVersion and chrome-for-testing.properties drifted apart");
    }

    @Test
    @DisplayName("apply rejects a browserVersion from another major")
    void applyRejectsForeignMajor() {
        var foreignMajor = Integer.parseInt(major(LocalChromePin.pinnedVersion())) + 1;
        var error = assertThrows(IllegalStateException.class,
                () -> LocalChromePin.apply(String.valueOf(foreignMajor)));
        assertTrue(error.getMessage().contains("pinned build is"), error.getMessage());
    }

    @Test
    @DisplayName("apply refuses to fall back to system Chrome")
    void applyRejectsBlankBrowserVersion() {
        var error = assertThrows(IllegalStateException.class, () -> LocalChromePin.apply(" "));
        assertTrue(error.getMessage().contains("browserVersion is required"), error.getMessage());
    }

    @Test
    @DisplayName("runtime rejects a non-Chromium browser")
    void requireChromiumRejectsFirefox() {
        var config = ConfigFactory.create(TestConfig.class, Map.of("browser", "firefox"));
        var error = assertThrows(IllegalStateException.class, () -> PlaywrightRuntime.requireChromium(config));
        assertTrue(error.getMessage().contains("Chromium-only"), error.getMessage());
    }
}
