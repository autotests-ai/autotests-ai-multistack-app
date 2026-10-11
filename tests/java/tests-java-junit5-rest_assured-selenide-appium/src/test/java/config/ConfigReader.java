package config;

import org.aeonbits.owner.ConfigFactory;

public final class ConfigReader {

    private ConfigReader() {
    }

    public static final TestConfig testConfig = ConfigFactory.create(
            TestConfig.class, System.getProperties(), System.getenv());
}
