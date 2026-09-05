package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    /** Host-reachable API, already ending at {@code /api}. AuthSetup uses this. */
    @Key("apiBase")
    @DefaultValue("")
    String apiBase();

    @Key("backendId")
    @DefaultValue("backend-java-spring")
    String backendId();

    /**
     * Empty → {@link #apiBase()}. Android emulator loopback for {@code ci}
     * ({@code 10.0.2.2}). Baked at assemble, not injected at session start.
     */
    @Key("androidApiBase")
    @DefaultValue("")
    String androidApiBase();

    /** Empty → {@link #apiBase()}. Appium {@code processArguments.env} for iOS. */
    @Key("iosApiBase")
    @DefaultValue("")
    String iosApiBase();
}
