package config;

public enum AppPlatform {
    ANDROID,
    IOS;

    public static AppPlatform current() {
        String raw = System.getProperty("platform");
        if (raw == null || raw.isBlank()) {
            raw = System.getenv("PLATFORM");
        }
        if (raw == null || raw.isBlank()) {
            String host = System.getProperty("deviceHost");
            if (host == null || host.isBlank()) {
                host = System.getenv("DEVICE_HOST");
            }
            if (host != null && "simulator".equalsIgnoreCase(host.trim())) {
                return IOS;
            }
            return ANDROID;
        }
        return switch (raw.trim().toLowerCase()) {
            case "android" -> ANDROID;
            case "ios" -> IOS;
            default -> throw new IllegalStateException("Unknown platform: " + raw);
        };
    }
}
