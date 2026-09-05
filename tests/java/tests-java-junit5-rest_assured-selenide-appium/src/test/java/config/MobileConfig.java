package config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class MobileConfig {

    static final Path ANDROID_APK = Paths.get(
            "..", "..", "..",
            "mobile", "kotlin", "mobile-kotlin-compose",
            "app", "build", "outputs", "apk", "debug", "multistack-app.apk");

    static final Path IOS_SIM_APP = Paths.get(
            "..", "..", "..",
            "mobile", "swift", "mobile-swift-swiftui",
            "build", "Build", "Products", "Debug-iphonesimulator", "multistack-app.app");

    private MobileConfig() {
    }

    public static String hubUrl() {
        return switch (DeviceHost.current()) {
            case BROWSERSTACK -> optional(
                    "BROWSERSTACK_HUB_URL", "https://hub.browserstack.com/wd/hub");
            case SELENOID -> optional(
                    "SELENOID_HUB", "https://user1:1234@selenoid.qa.guru/wd/hub");
            case EMULATOR, REAL, SIMULATOR -> optional("APPIUM_URL", "http://127.0.0.1:4723/wd/hub");
        };
    }

    public static String localAndroidApp() {
        return existingFile("ANDROID_APP", ANDROID_APK,
                "Build it: cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug");
    }

    public static String localIosApp() {
        return existingFile("IOS_APP", IOS_SIM_APP,
                "Build it: cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh");
    }

    public static String androidUdid() {
        return System.getenv("ANDROID_UDID");
    }

    public static String iosUdid() {
        return System.getenv("IOS_UDID");
    }

    public static String iosBundleId() {
        return optional("IOS_BUNDLE_ID", "dev.multistack.swiftui");
    }

    /** GitHub Release asset — selenoid.qa.guru fetches this, not a laptop path. */
    static final String ANDROID_APK_URL =
            "https://github.com/autotests-ai/autotests-ai-multistack-app/releases/download/apk/multistack-app.apk";

    public static String androidAppUrl() {
        return optional("ANDROID_APP_URL", ANDROID_APK_URL);
    }

    public static String androidVersion() {
        return optional("ANDROID_VERSION", "13.0");
    }

    public static String browserstackUsername() {
        return required("BROWSERSTACK_USERNAME");
    }

    public static String browserstackAccessKey() {
        return required("BROWSERSTACK_ACCESS_KEY");
    }

    public static String browserstackApp() {
        return required("BROWSERSTACK_APP_ID");
    }

    public static String browserstackDevice() {
        return optional("BROWSERSTACK_DEVICE", "Google Pixel 7");
    }

    public static String browserstackOsVersion() {
        return optional("BROWSERSTACK_OS_VERSION", "13.0");
    }

    public static String browserstackIosApp() {
        return required("BROWSERSTACK_IOS_APP_ID");
    }

    public static String browserstackIosDevice() {
        return optional("BROWSERSTACK_IOS_DEVICE", "iPhone 15");
    }

    public static String browserstackIosOsVersion() {
        return optional("BROWSERSTACK_IOS_OS_VERSION", "17");
    }

    public static String project() {
        return optional("BROWSERSTACK_PROJECT", "Multistack native");
    }

    public static String build() {
        return optional("BROWSERSTACK_BUILD", "native-e2e");
    }

    public static String xcodeOrgId() {
        return System.getenv("XCODE_ORG_ID");
    }

    public static String xcodeSigningId() {
        return optional("XCODE_SIGNING_ID", "iPhone Developer");
    }

    private static String existingFile(String envName, Path relativeDefault, String hint) {
        String configured = System.getenv(envName);
        Path path;
        if (configured == null || configured.isBlank()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(relativeDefault);
        } else {
            path = Paths.get(configured);
            if (!path.isAbsolute()) {
                path = Paths.get(System.getProperty("user.dir")).resolve(path);
            }
        }
        if (!Files.exists(path)) {
            throw new IllegalStateException("App artifact not found at " + path + ". " + hint);
        }
        return path.toAbsolutePath().normalize().toString();
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Set environment variable " + name);
        }
        return value;
    }

    static String optional(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
