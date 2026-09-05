package config;

/**
 * Which API the app talks to — web {@code -Denv} / {@code apiBaseUrl}, not
 * {@link DeviceHost}. Default is prod (GitHub APK live pair), not ci.
 */
public final class NativeEnv {

    private NativeEnv() {
    }

    public static String name() {
        String raw = System.getProperty("env");
        if (raw == null || raw.isBlank()) {
            raw = "prod";
        }
        raw = raw.trim().toLowerCase();
        switch (raw) {
            case "ci", "stage", "prod" -> {
            }
            case "mock" -> throw new IllegalStateException(
                    "Native Appium cell has no mock or screenshot stand. "
                            + "Use -Denv=ci|stage|prod. "
                            + "-DdeviceHost= is where the session runs, not which API.");
            default -> throw new IllegalStateException(
                    "Unknown -Denv=" + raw + ". Use ci, stage or prod.");
        }
        System.setProperty("env", raw);
        return raw;
    }

    public static void requireCompatibleHost() {
        String env = name();
        DeviceHost host = DeviceHost.current();
        if ("ci".equals(env) && (host == DeviceHost.SELENOID || host == DeviceHost.BROWSERSTACK)) {
            throw new IllegalStateException(
                    "-Denv=ci is laptop compose (localhost:8800). "
                            + host + " cannot reach it. GitHub APK is the prod live pair: "
                            + "-Denv=prod. deviceHost stays separate.");
        }
    }
}
