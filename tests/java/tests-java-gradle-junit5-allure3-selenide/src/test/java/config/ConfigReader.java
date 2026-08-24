package config;

import org.aeonbits.owner.ConfigFactory;

public final class ConfigReader {

    private ConfigReader() {
    }

    public static final TestConfig testConfig = ConfigFactory.create(TestConfig.class);

    public static String resolveBaseUrl() {
        return resolveBaseUrl(testConfig);
    }

    public static String resolveBaseUrl(TestConfig config) {
        var url = config.baseUrl().trim();
        if (!url.isEmpty()) return withSlash(url);

        throw new IllegalStateException("Set baseUrl in config/${env}.properties");
    }

    public static String resolveApiBaseUrl() {
        return resolveApiBaseUrl(testConfig);
    }

    public static String resolveApiBaseUrl(TestConfig config) {
        var apiUrl = config.apiBaseUrl().trim();
        if (!apiUrl.isEmpty()) return withSlash(apiUrl);

        var hubUrl = config.hubUrl().trim();
        if (!hubUrl.isEmpty()) return withSlash(hubUrl);

        throw new IllegalStateException("Set apiBaseUrl or hubUrl in config/${env}.properties");
    }

    private static String withSlash(String s) {
        return s.endsWith("/") ? s : s + "/";
    }
}
