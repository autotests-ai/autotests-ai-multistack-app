package tests.infra;

import tests.AllureMeta;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import config.ConfigReader;
import helpers.LocalChromePin;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Local browser pin (infra-frontend): the suite is not Chrome-only.
 * <p>
 * Living helper is {@link LocalChromePin} (Chrome for Testing). {@code TestBase}
 * applies it only when {@code remoteUrl} is empty and {@code browser=chrome}.
 * Selenoid uses the hub image tag; {@code -Dbrowser=firefox} skips the pin.
 * Do not grow this helper into a multi-browser installer until there is a
 * matching pin + screenshot folder ({@code firefox-140/} beside {@code chrome-148/}).
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
}
