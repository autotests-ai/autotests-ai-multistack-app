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

    @Key("attachBrowserConsoleLogs")
    @DefaultValue("false")
    boolean attachBrowserConsoleLogs();

    @Key("attachLastScreenshot")
    @DefaultValue("false")
    boolean attachLastScreenshot();

    @Key("attachPageSource")
    @DefaultValue("false")
    boolean attachPageSource();

    @Key("attachVideo")
    @DefaultValue("false")
    boolean attachVideo();

    @Key("baseUrl")
    @DefaultValue("")
    String baseUrl();

    @Key("apiBaseUrl")
    @DefaultValue("")
    String apiBaseUrl();

    @Key("apiHealthService")
    @DefaultValue("backend-java-spring")
    String apiHealthService();

    @Key("welcomeUsername")
    @DefaultValue("user1")
    String welcomeUsername();

    @Key("remoteUrl")
    @DefaultValue("")
    String remoteUrl();

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

    @Key("closeBrowserAfterEach")
    @DefaultValue("true")
    boolean closeBrowserAfterEach();

    @Key("closeBrowserAfterAll")
    @DefaultValue("true")
    boolean closeBrowserAfterAll();

    @Key("skipBlankOpen")
    @DefaultValue("false")
    boolean skipBlankOpen();

    @Key("enableVnc")
    @DefaultValue("false")
    boolean enableVnc();

    @Key("enableVideo")
    @DefaultValue("false")
    boolean enableVideo();

    @Key("videoFolder")
    @DefaultValue("")
    String videoFolder();

    @Key("logToConsole")
    @DefaultValue("true")
    boolean logToConsole();

    @Key("rootLogLevel")
    @DefaultValue("info")
    String rootLogLevel();
}
