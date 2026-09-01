package helpers;

import java.net.URI;
import java.util.Locale;

/**
 * Selenoid Playwright is a WebSocket ({@code wss://…/playwright/playwright-chromium/…}),
 * not WebDriver {@code /wd/hub}. Query may contain {@code accessKey} — never log it.
 */
public final class SelenoidPlaywrightEndpoint {

    private SelenoidPlaywrightEndpoint() {
    }

    /**
     * Prefer {@code SELENOID_PLAYWRIGHT_URL} (Jenkins/GHA env keeps {@code ?accessKey=}).
     * {@code -DremoteUrl=wss://…?accessKey=} is easy to truncate before the test JVM.
     */
    public static String resolve(String configRemoteUrl) {
        var fromEnv = preferWebSocket(System.getenv("SELENOID_PLAYWRIGHT_URL"), "");
        if (!fromEnv.isEmpty()) {
            return fromEnv;
        }
        var path = System.getenv("SELENOID_PLAYWRIGHT_URL_FILE");
        if (path != null && !path.isBlank()) {
            try {
                var fileUrl = java.nio.file.Files.readString(java.nio.file.Path.of(path)).trim();
                if (isWebSocket(fileUrl)) {
                    return fileUrl;
                }
            } catch (java.io.IOException ignored) {
                // fall through to -DremoteUrl / properties
            }
        }
        return preferWebSocket("", configRemoteUrl);
    }

    public static String preferWebSocket(String envUrl, String configUrl) {
        var env = envUrl == null ? "" : envUrl.trim();
        if (isWebSocket(env)) {
            return env;
        }
        return configUrl == null ? "" : configUrl.trim();
    }

    public static boolean isWebSocket(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        var u = url.trim().toLowerCase(Locale.ROOT);
        return u.startsWith("ws://") || u.startsWith("wss://");
    }

    public static boolean isHttpUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        var u = url.trim().toLowerCase(Locale.ROOT);
        return u.startsWith("http://") || u.startsWith("https://");
    }

    /** Scheme + host + path only. */
    public static String describe(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        try {
            var uri = URI.create(url.trim());
            var host = uri.getHost() == null ? "" : uri.getHost();
            var path = uri.getPath() == null ? "" : uri.getPath();
            var scheme = uri.getScheme() == null ? "" : uri.getScheme();
            return scheme + "://" + host + path;
        } catch (IllegalArgumentException e) {
            return "(unparseable remoteUrl)";
        }
    }

    /**
     * Playwright's WS client drops raw {@code \{} {@code \}} in the query.
     * Percent-encode so nginx still sees the same accessKey.
     */
    public static String forConnect(String ws) {
        var u = ws.trim();
        var q = u.indexOf('?');
        if (q < 0) {
            return u;
        }
        return u.substring(0, q + 1) + u.substring(q + 1)
                .replace("{", "%7B")
                .replace("}", "%7D");
    }
}
