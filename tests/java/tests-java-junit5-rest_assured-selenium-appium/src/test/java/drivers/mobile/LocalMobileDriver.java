package drivers.mobile;

import config.TestConfig;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.MutableCapabilities;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Local Appium (appiumUrl): android on emulator|real, ios on simulator|real.
 * Real devices need -Dudid= and (ios) -Dios.app= to an iphoneos build.
 */
public final class LocalMobileDriver extends AppiumDriverBase {

    private static final Path DEFAULT_APK = Path.of(
            "..", "..", "..",
            "mobile", "kotlin", "mobile-kotlin-compose",
            "app", "build", "outputs", "apk", "debug", "app-debug.apk");

    private static final Path DEFAULT_APP = Path.of(
            "..", "..", "..",
            "mobile", "swift", "mobile-swift-swiftui",
            "build", "Build", "Products", "Debug-iphonesimulator", "multistack-app.app");

    public static AppiumDriver create(TestConfig config) {
        String host = System.getProperty("deviceHost", "emulator");
        String platform = System.getProperty("platform", "android");
        java.net.URL hub = hubUrl(config.appiumUrl());
        boolean real = "real".equals(host);
        return switch (platform.toLowerCase()) {
            case "android" -> {
                if (!"emulator".equals(host) && !real) {
                    throw new IllegalArgumentException(
                            "Android local deviceHost: emulator, real. Got: " + host);
                }
                yield new AndroidDriver(hub, localAndroidCaps(config, real));
            }
            case "ios" -> {
                if (!"simulator".equals(host) && !real) {
                    throw new IllegalArgumentException(
                            "iOS local deviceHost: simulator, real. Got: " + host);
                }
                yield new IOSDriver(hub, localIosCaps(config, real));
            }
            default -> throw new IllegalArgumentException(
                    "platform: android or ios. Got: " + platform);
        };
    }

    private static MutableCapabilities localAndroidCaps(TestConfig config, boolean realDevice) {
        MutableCapabilities caps = androidCaps();
        caps.setCapability("appium:app", resolveAppPath(config.androidApp(), DEFAULT_APK,
                "APK not found. Build: cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug"));
        caps.setCapability("appium:ignoreHiddenApiPolicyError", true);
        String udid = config.udid();
        if (realDevice && (udid == null || udid.isBlank())) {
            throw new IllegalStateException("Set -Dudid= to the USB device (adb devices)");
        }
        if (udid != null && !udid.isBlank()) {
            caps.setCapability("appium:udid", udid);
        }
        return caps;
    }

    private static MutableCapabilities localIosCaps(TestConfig config, boolean realDevice) {
        MutableCapabilities caps = iosCaps(config);
        String configured = config.iosApp();
        if (realDevice && (configured == null || configured.isBlank())) {
            throw new IllegalStateException(
                    "Set -Dios.app= to the device .app (iphoneos), not the simulator build");
        }
        String app = resolveAppPath(configured, DEFAULT_APP,
                realDevice
                        ? "App not found. Pass -Dios.app= to a Debug-iphoneos .app"
                        : "App not found. Build: cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh");
        if (realDevice && app.contains("iphonesimulator")) {
            throw new IllegalStateException(
                    "iOS real needs an iphoneos .app, not " + app);
        }
        caps.setCapability("appium:app", app);
        String udid = config.udid();
        if (realDevice && (udid == null || udid.isBlank())) {
            throw new IllegalStateException(
                    "Set -Dudid= to the iPhone (Xcode → Window → Devices)");
        }
        if (udid != null && !udid.isBlank()) {
            caps.setCapability("appium:udid", udid);
        }
        if (!realDevice) {
            caps.setCapability("appium:deviceName", firstNonBlank(config.deviceName(), "iPhone 16"));
            caps.setCapability("appium:platformVersion", firstNonBlank(config.platformVersion(), "18.4"));
        }
        return caps;
    }

    /** Resolves an app artifact path; a blank configured value means the default build output. */
    private static String resolveAppPath(String configured, Path defaultPath, String notFoundHint) {
        Path path;
        if (configured == null || configured.isBlank()) {
            path = Path.of(System.getProperty("user.dir")).resolve(defaultPath);
        } else {
            path = Path.of(configured);
            if (!path.isAbsolute()) {
                path = Path.of(System.getProperty("user.dir")).resolve(path);
            }
        }
        path = path.toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IllegalStateException(notFoundHint + " (" + path + ")");
        }
        return path.toString();
    }
}
