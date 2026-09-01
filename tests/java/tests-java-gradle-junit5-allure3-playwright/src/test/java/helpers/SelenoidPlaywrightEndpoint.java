package helpers;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.stream.Collectors;

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
        return preferWebSocket(System.getenv("SELENOID_PLAYWRIGHT_URL"), configRemoteUrl);
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

    public static String withSessionQuery(String ws, boolean enableVnc, boolean enableVideo) {
        var base = ws.trim();
        var extra = new LinkedHashMap<String, String>();
        extra.put("name", "autotests-ai-multistack-java-pw");
        extra.put("sessionTimeout", "5m");
        extra.put("enableVNC", enableVnc ? "true" : "false");
        extra.put("enableVideo", enableVideo ? "true" : "false");
        var encoded = extra.entrySet().stream()
                .map(e -> enc(e.getKey()) + "=" + enc(e.getValue()))
                .collect(Collectors.joining("&"));
        return base.contains("?") ? base + "&" + encoded : base + "?" + encoded;
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
