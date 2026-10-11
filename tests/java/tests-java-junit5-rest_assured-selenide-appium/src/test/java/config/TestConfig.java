package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    String apiBase();

    /** Web UI target for tests/ui (WebBrowserDriver), empty = fail fast. */
    @DefaultValue("")
    String baseUrl();

    @DefaultValue("chrome")
    String browser();

    /** Selenoid image tag when remoteUrl is set; ignored by local Chrome. */
    @DefaultValue("148")
    String browserVersion();

    @DefaultValue("1920x1280")
    String browserSize();

    @DefaultValue("false")
    boolean headless();

    /** Web hub (selenoid:options apply). Empty = local Chrome. */
    @DefaultValue("")
    String remoteUrl();

    @DefaultValue("false")
    boolean enableVnc();

    @DefaultValue("false")
    boolean enableVideo();

    @DefaultValue("false")
    boolean attachLastScreenshot();

    @DefaultValue("false")
    boolean attachPageSource();

    /** Driver logs — logcat/syslog/server on devices, browser/driver/client on web. */
    @DefaultValue("false")
    boolean attachDriverLogs();

    /** Local screen recording (mp4) and farm video fetch. */
    @DefaultValue("false")
    boolean attachVideo();

    @DefaultValue("backend-java-spring")
    String backendId();

    @DefaultValue("http://127.0.0.1:4723/wd/hub")
    String appiumUrl();

    @DefaultValue("https://user1:1234@selenoid.qa.guru/wd/hub")
    String selenoidUrl();

    @Key("android.app")
    @DefaultValue("")
    String androidApp();

    @Key("ios.app")
    @DefaultValue("")
    String iosApp();

    @Key("android.app.url")
    @DefaultValue("https://github.com/autotests-ai/autotests-ai-multistack-app/releases/download/apk/multistack-app.apk")
    String androidAppUrl();

    @DefaultValue("")
    String udid();

    @DefaultValue("")
    String deviceName();

    @DefaultValue("")
    String platformVersion();

    @DefaultValue("https://hub.browserstack.com/wd/hub")
    String browserstackUrl();

    @Key("browserstack.user")
    String browserstackUser();

    @Key("browserstack.key")
    String browserstackKey();

    @Key("browserstack.app")
    String browserstackApp();

    @Key("browserstack.ios.app")
    String browserstackIosApp();

    @Key("browserstack.device")
    @DefaultValue("Google Pixel 7")
    String browserstackDevice();

    @Key("browserstack.osVersion")
    @DefaultValue("16")
    String browserstackOsVersion();

    @Key("browserstack.ios.device")
    @DefaultValue("iPhone 15")
    String browserstackIosDevice();

    @Key("browserstack.ios.osVersion")
    @DefaultValue("17")
    String browserstackIosOsVersion();
}
