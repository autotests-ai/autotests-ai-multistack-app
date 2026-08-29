package tests;

import annotations.Framework;
import annotations.Scope;
import config.ConfigReader;
import config.TestConfig;
import helpers.PlaywrightRuntime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import pages.App;

@Scope("browser")
@Framework("playwright")
public class TestBase extends AllureMeta {

    protected static final TestConfig config = ConfigReader.testConfig;

    private PlaywrightRuntime runtime;
    protected App app;

    @BeforeEach
    void startPlaywright() {
        runtime = new PlaywrightRuntime(config);
        app = runtime.app;
    }

    @AfterEach
    void stopPlaywright() {
        if (runtime != null) {
            runtime.close();
            runtime = null;
        }
    }
}
