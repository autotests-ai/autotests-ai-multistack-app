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
    @DefaultValue("13.0")
    String browserstackOsVersion();

    @Key("browserstack.ios.device")
    @DefaultValue("iPhone 15")
    String browserstackIosDevice();

    @Key("browserstack.ios.osVersion")
    @DefaultValue("17")
    String browserstackIosOsVersion();
}
