using Config;
using Helpers;
using Pages;

namespace Tests;

/// <summary>Browser tests (ui + e2e). API tests stay on <see cref="ApiTestBase"/>.</summary>
[Allure.NUnit.Attributes.AllureLabel("scope", "browser")]
public abstract class TestBase : AllureMeta
{
    protected readonly HomePage HomePage = new();
    protected readonly LoginPage LoginPage = new();
    protected readonly RegisterPage RegisterPage = new();

    protected static TestConfig Config { get; private set; } = null!;

    [OneTimeSetUp]
    public void SetupBrowserCell()
    {
        Config = ConfigReader.LoadConfig();
        global::Api.RestSharpHttp.Setup(Config);
    }

    [SetUp]
    public void BeforeEach()
    {
        if (!Config.SkipBlankOpen)
        {
            WebDrivers.EnsureSession();
        }
    }

    [TearDown]
    public void AfterEach()
    {
        if (Config.CloseBrowserAfterEach)
        {
            WebDriverHolder.Quit();
        }
    }

    [OneTimeTearDown]
    public void AfterAll()
    {
        if (Config.CloseBrowserAfterAll && WebDriverHolder.Has)
        {
            WebDriverHolder.Quit();
        }
    }
}
