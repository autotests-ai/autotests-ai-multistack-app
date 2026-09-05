package config;

import org.aeonbits.owner.ConfigFactory;

public final class ConfigReader {

    public static final TestConfig testConfig;

    static {
        NativeEnv.name();
        testConfig = ConfigFactory.create(TestConfig.class);
    }

    private ConfigReader() {
    }

    /** Laptop / AuthSetup. */
    public static String apiBase() {
        String value = firstNonBlank(
                System.getProperty("apiBase"),
                System.getenv("API_BASE"),
                testConfig.apiBase());
        if (value == null) {
            throw new IllegalStateException(
                    "Set apiBase in config/" + NativeEnv.name() + ".properties or -DapiBase=");
        }
        return stripSlash(value);
    }

    /** Device-side URL for Android assemble ({@code -Penv=}). */
    public static String androidApiBase() {
        String value = firstNonBlank(
                System.getProperty("androidApiBase"),
                testConfig.androidApiBase());
        return stripSlash(value != null ? value : apiBase());
    }

    /** Device-side URL for iOS processArguments / Info.plist. */
    public static String iosApiBase() {
        String value = firstNonBlank(
                System.getProperty("iosApiBase"),
                System.getenv("MULTISTACK_API_BASE"),
                testConfig.iosApiBase());
        return stripSlash(value != null ? value : apiBase());
    }

    public static String backendId() {
        String value = firstNonBlank(
                System.getProperty("backendId"),
                System.getenv("BACKEND_ID"),
                System.getenv("MULTISTACK_BACKEND_ID"),
                testConfig.backendId());
        return value == null ? "backend-java-spring" : value;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String stripSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
