package config;

public enum DeviceHost {
    BROWSERSTACK,
    EMULATOR,
    REAL,
    SELENOID,
    SIMULATOR;

    public static DeviceHost current() {
        String raw = System.getProperty("deviceHost");
        if (raw == null || raw.isBlank()) {
            raw = System.getenv("DEVICE_HOST");
        }
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(
                    "Set -DdeviceHost= or DEVICE_HOST to one of: "
                            + "browserstack, emulator, real, selenoid, simulator");
        }
        DeviceHost host = switch (raw.trim().toLowerCase()) {
            case "browserstack" -> BROWSERSTACK;
            case "emulator", "emulation" -> EMULATOR;
            case "real" -> REAL;
            case "selenoid" -> SELENOID;
            case "simulator", "sim" -> SIMULATOR;
            default -> throw new IllegalStateException("Unknown deviceHost: " + raw);
        };
        AppPlatform platform = AppPlatform.current();
        if (platform == AppPlatform.IOS) {
            if (host == EMULATOR) {
                host = SIMULATOR;
            }
            if (host == SELENOID) {
                throw new IllegalStateException(
                        "selenoid.qa.guru has android images only (qaguru/android). No iOS.");
            }
            if (host != BROWSERSTACK && host != SIMULATOR && host != REAL) {
                throw new IllegalStateException("iOS hosts: browserstack, simulator, real");
            }
        } else if (host == SIMULATOR) {
            throw new IllegalStateException("Android AVD is -DdeviceHost=emulator, not simulator");
        }
        return host;
    }
}
