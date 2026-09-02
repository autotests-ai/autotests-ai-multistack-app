package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    @Key("allureReportMode")
    @DefaultValue("allure3")
    String allureReportMode();

    @Key("allureAgentMode")
    @DefaultValue("none")
    String allureAgentMode();

    @Key("attachBrowserConsoleLogs")
    @DefaultValue("false")
    boolean attachBrowserConsoleLogs();

    @Key("attachHarLogs")
    @DefaultValue("false")
    boolean attachHarLogs();

    @Key("attachLastScreenshot")
    @DefaultValue("false")
    boolean attachLastScreenshot();

    @Key("attachPageSource")
    @DefaultValue("false")
    boolean attachPageSource();

    @Key("attachVideo")
    @DefaultValue("false")
    boolean attachVideo();

    @Key("enableAllureRestAssuredListener")
    @DefaultValue("false")
    boolean enableAllureRestAssuredListener();

    @Key("allureRestAssuredListenerStyle")
    @DefaultValue("default")
    String allureRestAssuredListenerStyle();

    @Key("baseUrl")
    @DefaultValue("")
    String baseUrl();

    @Key("apiBaseUrl")
    @DefaultValue("")
    String apiBaseUrl();

    @Key("apiHealthService")
    @DefaultValue("backend-java-spring")
    String apiHealthService();

    /** Display name in the home welcome panel after seed login. Mock stand stubs {@code mock-user}. */
    @Key("welcomeUsername")
    @DefaultValue("user1")
    String welcomeUsername();

    @Key("remoteUrl")
    @DefaultValue("")
    String remoteUrl();

    /**
     * This cell is Chromium-only: local Chrome for Testing, or Selenoid
     * {@code wss://…/playwright-chromium/…}. {@code firefox} is not a runtime path.
     */
    @Key("browser")
    @DefaultValue("chrome")
    String browser();

    @Key("browserVersion")
    @DefaultValue("148")
    String browserVersion();

    @Key("browserSize")
    @DefaultValue("1920x1280")
    String browserSize();

    @Key("headless")
    @DefaultValue("false")
    boolean headless();

    @Key("enableHar")
    @DefaultValue("false")
    boolean enableHar();

    @Key("enableVnc")
    @DefaultValue("false")
    boolean enableVnc();

    @Key("enableVideo")
    @DefaultValue("false")
    boolean enableVideo();

    /**
     * Public Selenoid video base ({@code https://selenoid.qa.guru/video/}). Hub Allure
     * player uses {@code videoFolder} + the {@code videoName} sent on WS connect.
     */
    @Key("videoFolder")
    @DefaultValue("")
    String videoFolder();

    @Key("updateScreenshots")
    @DefaultValue("false")
    boolean updateScreenshots();

    @Key("screenshotsDir")
    @DefaultValue("screenshots")
    String screenshotsDir();

    @Key("screenshotDiffThreshold")
    @DefaultValue("0.015")
    double screenshotDiffThreshold();

    @Key("logToConsole")
    @DefaultValue("true")
    boolean logToConsole();

    @Key("rootLogLevel")
    @DefaultValue("info")
    String rootLogLevel();

}
