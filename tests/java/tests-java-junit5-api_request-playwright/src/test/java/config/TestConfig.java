package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    @DefaultValue("allure3")
    String allureReportMode();

    @DefaultValue("none")
    String allureAgentMode();

    @DefaultValue("false")
    boolean attachBrowserConsoleLogs();

    @DefaultValue("false")
    boolean attachHarLogs();

    @DefaultValue("false")
    boolean attachLastScreenshot();

    @DefaultValue("false")
    boolean attachPageSource();

    @DefaultValue("false")
    boolean attachVideo();

    @DefaultValue("false")
    boolean enableAllureRestAssuredListener();

    @DefaultValue("default")
    String allureRestAssuredListenerStyle();

    @DefaultValue("")
    String baseUrl();

    @DefaultValue("")
    String apiBaseUrl();

    @DefaultValue("backend-java-spring")
    String apiHealthService();

    /** Display name in the home welcome panel after seed login. Mock stand stubs {@code mock-user}. */
    @DefaultValue("user1")
    String welcomeUsername();

    @DefaultValue("")
    String remoteUrl();

    /**
     * This cell is Chromium-only: local Chrome for Testing, or Selenoid
     * {@code wss://…/playwright-chromium/…}. {@code firefox} is not a runtime path.
     */
    @DefaultValue("chrome")
    String browser();

    @DefaultValue("148")
    String browserVersion();

    @DefaultValue("1920x1280")
    String browserSize();

    @DefaultValue("false")
    boolean headless();

    @DefaultValue("false")
    boolean enableHar();

    @DefaultValue("false")
    boolean enableVnc();

    @DefaultValue("false")
    boolean enableVideo();

    /**
     * Public Selenoid video base ({@code https://selenoid.qa.guru/video/}). Hub Allure
     * player uses {@code videoFolder} + the {@code videoName} sent on WS connect.
     */
    @DefaultValue("")
    String videoFolder();

    @DefaultValue("false")
    boolean updateScreenshots();

    @DefaultValue("screenshots")
    String screenshotsDir();

    @DefaultValue("0.015")
    double screenshotDiffThreshold();

    @DefaultValue("true")
    boolean logToConsole();

    @DefaultValue("info")
    String rootLogLevel();

}
