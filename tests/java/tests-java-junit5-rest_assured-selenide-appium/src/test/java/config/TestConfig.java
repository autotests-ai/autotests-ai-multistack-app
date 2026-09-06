package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    @Key("apiBase")
    String apiBase();

    @Key("backendId")
    @DefaultValue("backend-java-spring")
    String backendId();

    @Key("appiumUrl")
    @DefaultValue("http://127.0.0.1:4723/wd/hub")
    String appiumUrl();

    @Key("selenoidUrl")
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

    @Key("udid")
    @DefaultValue("")
    String udid();

    @Key("deviceName")
    @DefaultValue("")
    String deviceName();

    @Key("platformVersion")
    @DefaultValue("")
    String platformVersion();
}
