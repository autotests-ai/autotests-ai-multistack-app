package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:browserstack.properties",
})
public interface BrowserstackConfig extends Config {

    @Key("browserstack.user")
    String user();

    @Key("browserstack.key")
    String key();

    @Key("browserstack.app")
    String app();

    @Key("browserstack.ios.app")
    String iosApp();

    @Key("browserstack.device")
    @DefaultValue("Google Pixel 7")
    String device();

    @Key("browserstack.osVersion")
    @DefaultValue("13.0")
    String osVersion();

    @Key("browserstack.ios.device")
    @DefaultValue("iPhone 15")
    String iosDevice();

    @Key("browserstack.ios.osVersion")
    @DefaultValue("17")
    String iosOsVersion();
}
