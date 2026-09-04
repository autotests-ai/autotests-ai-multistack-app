package api;

import tests.AllureMeta;
import config.ConfigReader;
import config.TestConfig;

public class ApiTestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    static {
        PlaywrightHttp.setup(config);
    }
}
