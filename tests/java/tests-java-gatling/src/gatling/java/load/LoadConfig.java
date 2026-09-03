package load;

/**
 * Stand + injection knobs for the Gatling JVM (not Gradle).
 * Seed user matches testdata-user: {@code user1} / {@code password1}.
 */
public final class LoadConfig {

    private LoadConfig() {
    }

    public static String apiBaseUrl() {
        return stripTrailingSlash(firstNonBlank(
                System.getProperty("apiBaseUrl"),
                System.getenv("API_BASE_URL"),
                "http://localhost:8800"));
    }

    public static String username() {
        return firstNonBlank(System.getProperty("username"), System.getenv("LOAD_USERNAME"), "user1");
    }

    public static String password() {
        return firstNonBlank(System.getProperty("password"), System.getenv("LOAD_PASSWORD"), "password1");
    }

    public static String profile() {
        return firstNonBlank(System.getProperty("gatling.profile"), System.getenv("GATLING_PROFILE"), "smoke")
                .toLowerCase();
    }

    public static int users() {
        return Math.max(1, parseInt(
                firstNonBlank(System.getProperty("gatling.users"), System.getenv("GATLING_USERS"), "1"),
                1));
    }

    public static int duringSeconds() {
        return Math.max(1, parseInt(
                firstNonBlank(
                        System.getProperty("gatling.duringSeconds"),
                        System.getenv("GATLING_DURING_SECONDS"),
                        "30"),
                30));
    }

    public static int p95Ms() {
        return Math.max(1, parseInt(
                firstNonBlank(System.getProperty("gatling.p95Ms"), System.getenv("GATLING_P95_MS"), "2000"),
                2000));
    }

    public static boolean allowPublic() {
        return Boolean.parseBoolean(firstNonBlank(
                System.getProperty("gatling.allowPublic"),
                System.getenv("GATLING_ALLOW_PUBLIC"),
                "false"));
    }

    public static String loginJson() {
        return "{\"username\":\"" + jsonEscape(username()) + "\",\"password\":\"" + jsonEscape(password()) + "\"}";
    }

    public static void refuseSharedProd(String baseUrl) {
        String lower = baseUrl.toLowerCase();
        boolean shared = lower.contains("autotests.ai") || lower.contains("qa.guru");
        if (shared && !allowPublic()) {
            throw new IllegalStateException(
                    "Refusing " + baseUrl + " — isolated SUT only. Pass -Dgatling.allowPublic=true when the host is a dedicated load stand.");
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private static String stripTrailingSlash(String url) {
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    private static int parseInt(String raw, int fallback) {
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static String jsonEscape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
