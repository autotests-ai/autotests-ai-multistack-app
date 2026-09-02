package helpers;

import config.ConfigReader;
import io.qameta.allure.Step;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chromium.HasCdp;
import org.openqa.selenium.remote.Augmenter;

import java.util.Map;
import java.util.Optional;

public final class ViewportHelper {

    private ViewportHelper() {
    }

    @Step("Reset viewport to default browser size")
    public static void resetViewport() {
        if (!WebDriverHolder.has()) {
            return;
        }
        var driver = WebDriverHolder.get();
        resolveCdp(driver).ifPresentOrElse(
                cdp -> cdp.executeCdpCommand("Emulation.clearDeviceMetricsOverride", Map.of()),
                () -> driver.manage().window().setSize(parseBrowserSize(ConfigReader.testConfig.browserSize()))
        );
    }

    public static void setViewport(int width, int height) {
        if (!WebDriverHolder.has()) {
            WebDrivers.startBlank();
        }
        var driver = WebDriverHolder.get();
        resolveCdp(driver).ifPresent(
                cdp -> cdp.executeCdpCommand("Emulation.clearDeviceMetricsOverride", Map.of())
        );
        var metrics = Map.<String, Object>of(
                "width", width,
                "height", height,
                "deviceScaleFactor", 1,
                "mobile", false
        );
        resolveCdp(driver).ifPresentOrElse(
                cdp -> cdp.executeCdpCommand("Emulation.setDeviceMetricsOverride", metrics),
                () -> driver.manage().window().setSize(new Dimension(width, height))
        );
    }

    private static Optional<HasCdp> resolveCdp(WebDriver driver) {
        if (driver instanceof HasCdp hasCdp) {
            return Optional.of(hasCdp);
        }
        try {
            var augmented = new Augmenter().augment(driver);
            if (augmented instanceof HasCdp hasCdp) {
                return Optional.of(hasCdp);
            }
        } catch (RuntimeException ignored) {
            // Selenoid without CDP — fall back to window resize.
        }
        return Optional.empty();
    }

    private static Dimension parseBrowserSize(String browserSize) {
        var parts = browserSize.split("x");
        if (parts.length != 2) {
            throw new IllegalStateException("Invalid browserSize: " + browserSize);
        }
        return new Dimension(Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim()));
    }
}
